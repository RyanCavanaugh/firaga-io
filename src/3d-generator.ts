import { PartListImage } from "./image-utils";
import { nameOfColor } from "./utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
    filename: string;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    load3DLibsAnd(() => make3DWorker(image, settings));
}

async function load3DLibsAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

function make3DWorker(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF XML content
    const pitch = settings.pitch;
    const height = settings.height;
    
    let modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const r = (part.target.r / 255).toFixed(6);
        const g = (part.target.g / 255).toFixed(6);
        const b = (part.target.b / 255).toFixed(6);
        modelXML += `      <base name="${escapeXML(part.target.name)}" displaycolor="#${rgbToHex(part.target.r, part.target.g, part.target.b)}" />\n`;
    });

    modelXML += `    </basematerials>\n`;

    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    image.partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Collect all pixels of this color
        const pixels: [number, number][] = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    pixels.push([x, y]);
                }
            }
        }

        // Create a cube for each pixel
        pixels.forEach(([x, y]) => {
            const x0 = x * pitch;
            const x1 = (x + 1) * pitch;
            const y0 = y * pitch;
            const y1 = (y + 1) * pitch;
            const z0 = 0;
            const z1 = height;

            // 8 vertices of the cube
            const v0 = vertexCount++;
            vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
            const v1 = vertexCount++;
            vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
            const v2 = vertexCount++;
            vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
            const v3 = vertexCount++;
            vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
            const v4 = vertexCount++;
            vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
            const v5 = vertexCount++;
            vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
            const v6 = vertexCount++;
            vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
            const v7 = vertexCount++;
            vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

            // 12 triangles (2 per face, 6 faces)
            // Bottom
            triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
            triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
            // Top
            triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
            triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
            // Front
            triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
            triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
            // Back
            triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
            triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
            // Left
            triangles.push(`      <triangle v1="${v3}" v2="${v0}" v3="${v4}" />`);
            triangles.push(`      <triangle v1="${v3}" v2="${v4}" v3="${v7}" />`);
            // Right
            triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
            triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
        });

        if (pixels.length > 0) {
            modelXML += `    <object id="${objectId}" type="model">\n`;
            modelXML += `      <mesh>\n`;
            modelXML += `        <vertices>\n`;
            modelXML += vertices.join('\n') + '\n';
            modelXML += `        </vertices>\n`;
            modelXML += `        <triangles>\n`;
            modelXML += triangles.join('\n') + '\n';
            modelXML += `        </triangles>\n`;
            modelXML += `      </mesh>\n`;
            modelXML += `    </object>\n`;
            objectIds.push(objectId);
            objectId++;
        }
    });

    modelXML += `  </resources>\n`;
    modelXML += `  <build>\n`;
    
    // Add each object to the build with its material
    objectIds.forEach((id, idx) => {
        modelXML += `    <item objectid="${id}" />\n`;
    });
    
    modelXML += `  </build>\n`;
    modelXML += `</model>`;

    // Create 3MF package (ZIP file)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", modelXML);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`);

    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = settings.filename + ".3mf";
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const pitch = settings.pitch;
    const height = settings.height;

    // Generate one monochrome image per color
    image.partList.forEach((part, partIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                if (image.pixels[y][x] === partIdx) {
                    // White for this color
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                } else {
                    // Black for other colors
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to PNG data URL and extract base64
        const dataURL = canvas.toDataURL("image/png");
        const base64 = dataURL.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        const colorName = nameOfColor(part.target).replace(/[^a-zA-Z0-9]/g, "_");
        zip.file(`mask_${partIdx}_${colorName}.png`, bytes);
    });

    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel art 3D model using heightmaps

pitch = ${pitch}; // Size of each pixel in mm
height = ${height}; // Height of each pixel in mm
width = ${image.width};
depth = ${image.height};

`;

    image.partList.forEach((part, partIdx) => {
        const colorName = nameOfColor(part.target).replace(/[^a-zA-Z0-9]/g, "_");
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        
        scadContent += `// ${part.target.name}\n`;
        scadContent += `color([${r/255}, ${g/255}, ${b/255}])\n`;
        scadContent += `scale([pitch, pitch, height])\n`;
        scadContent += `surface(file = "mask_${partIdx}_${colorName}.png", center = false, invert = true);\n\n`;
    });

    zip.file("model.scad", scadContent);

    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = settings.filename + "_openscad.zip";
        a.click();
        URL.revokeObjectURL(url);
    });
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

function escapeXML(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
