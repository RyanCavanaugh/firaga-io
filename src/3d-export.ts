import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type Export3DSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    height: number; // Height in mm for the 3D model
    pixelSize: number; // Size of each pixel in mm
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    // Load JSZip if not already loaded
    await loadJSZip();

    const zip = new JSZip();
    
    // Create 3MF structure
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    // Create the 3D model with separate meshes for each color
    const modelXml = create3MFModel(image, settings);

    zip.folder("_rels")!.file(".rels", rels);
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("3D")!.file("3dmodel.model", modelXml);

    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + ".3mf");
}

function create3MFModel(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList } = image;
    const { pixelSize, height: modelHeight } = settings;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;

    // Add materials for each color
    partList.forEach((part, idx) => {
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `\n            <base name="${escapeXml(part.target.name)}" displaycolor="#${hexColor}" />`;
    });

    xml += `\n        </basematerials>`;

    // Create a mesh object for each color
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build mesh for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = modelHeight;

                    // 8 vertices for a cube
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // Bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // Top
                    );

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left face
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            xml += `\n        <object id="${colorIdx + 2}" type="model">
            <mesh>
                <vertices>`;
            
            vertices.forEach(v => {
                xml += `\n                    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`;
            });

            xml += `\n                </vertices>
                <triangles>`;

            triangles.forEach(t => {
                xml += `\n                    <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />`;
            });

            xml += `\n                </triangles>
            </mesh>
        </object>`;
        }
    });

    xml += `\n    </resources>
    <build>`;

    // Add each color mesh to the build
    partList.forEach((part, idx) => {
        xml += `\n        <item objectid="${idx + 2}" />`;
    });

    xml += `\n    </build>
</model>`;

    return xml;
}

async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings) {
    // Load JSZip if not already loaded
    await loadJSZip();

    const zip = new JSZip();
    const { width, height, partList } = image;

    // Create a black/white PNG for each color
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const imageFiles: string[] = [];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const imageData = ctx.createImageData(width, height);
        
        // Fill with white background
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;     // R
            imageData.data[i + 1] = 255; // G
            imageData.data[i + 2] = 255; // B
            imageData.data[i + 3] = 255; // A
        }

        // Set black pixels where this color appears
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const idx = (y * width + x) * 4;
                    imageData.data[idx] = 0;     // R
                    imageData.data[idx + 1] = 0; // G
                    imageData.data[idx + 2] = 0; // B
                    imageData.data[idx + 3] = 255; // A
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        
        // Convert to PNG blob
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        imageFiles.push(filename);
        
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        zip.file(filename, base64Data, { base64: true });
    }

    // Create OpenSCAD file
    const scadContent = createOpenSCADFile(imageFiles, partList, settings);
    zip.file(settings.filename + ".scad", scadContent);

    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + "_openscad.zip");
}

function createOpenSCADFile(imageFiles: string[], partList: PartListImage["partList"], settings: Export3DSettings): string {
    const { pixelSize, height } = settings;
    
    let scad = `// Generated by firaga.io
// 3D model with color masks

pixel_size = ${pixelSize}; // mm per pixel
layer_height = ${height}; // mm height per layer

`;

    imageFiles.forEach((filename, idx) => {
        const part = partList[idx];
        const hexColor = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) / 255;
        const g = parseInt(hexColor.substring(2, 4), 16) / 255;
        const b = parseInt(hexColor.substring(4, 6), 16) / 255;

        scad += `
// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${idx * height}])
scale([pixel_size, pixel_size, layer_height])
surface(file = "${filename}", center = true, invert = true);
`;
    });

    return scad;
}

function escapeXml(str: string): string {
    return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error("Failed to load JSZip"));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
