import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create 3MF structure
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

    // Build the 3D model
    const model = build3MFModel(image, settings);
    
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("_rels")!.file(".rels", rels);
    zip.folder("3D")!.file("3dmodel.model", model);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function build3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove '#'
        const color = hexToRGB(hex);
        xml += `            <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}${Math.round(255).toString(16).padStart(2, '0')}" />\n`;
    });
    
    xml += `        </basematerials>\n`;
    
    // Create mesh objects for each color layer
    let objectId = 2;
    const objectIds: number[] = [];
    
    partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices for a box
                    const startVertex = vertexIndex;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    vertexIndex += 8;
                    
                    // 12 triangles for a box (2 per face)
                    const v = startVertex;
                    // Bottom face
                    triangles.push(`<triangle v1="${v+0}" v2="${v+2}" v3="${v+1}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+3}" v3="${v+2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${v+0}" v2="${v+1}" v3="${v+5}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+5}" v3="${v+4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${v+3}" v2="${v+0}" v3="${v+4}"/>`);
                    triangles.push(`<triangle v1="${v+3}" v2="${v+4}" v3="${v+7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}"/>`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `        <object id="${objectId}" type="model">\n`;
            xml += `            <mesh>\n`;
            xml += `                <vertices>\n`;
            vertices.forEach(v => xml += `                    ${v}\n`);
            xml += `                </vertices>\n`;
            xml += `                <triangles>\n`;
            triangles.forEach(t => xml += `                    ${t} pid="1" p1="${partIndex}"/>\n`);
            xml += `                </triangles>\n`;
            xml += `            </mesh>\n`;
            xml += `        </object>\n`;
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    xml += `    </resources>\n`;
    xml += `    <build>\n`;
    objectIds.forEach(id => {
        xml += `        <item objectid="${id}"/>\n`;
    });
    xml += `    </build>\n`;
    xml += `</model>`;
    
    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Create a black/white PNG for each color
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    
    const maskFiles: string[] = [];
    
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const imageData = ctx.createImageData(width, height);
        
        // Fill with white background
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;
            imageData.data[i + 1] = 255;
            imageData.data[i + 2] = 255;
            imageData.data[i + 3] = 255;
        }
        
        // Mark pixels with this color as black
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    const idx = (y * width + x) * 4;
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        
        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `mask_${partIndex}_${sanitizedName}.png`;
        maskFiles.push(filename);
        
        zip.file(filename, base64Data, { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, maskFiles, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, maskFiles: string[], settings: ThreeDSettings): string {
    const { width, height, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    let scad = `// Generated by firaga.io
// Image size: ${width}x${height}
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

`;
    
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        scad += `// ${part.target.name} (${hex})\n`;
        scad += `color("${hex}")\n`;
        scad += `translate([0, 0, ${baseHeight}])\n`;
        scad += `scale([1, 1, ${pixelHeight}])\n`;
        scad += `surface(file = "${maskFiles[idx]}", center = false, invert = true);\n\n`;
    });
    
    return scad;
}

function hexToRGB(hex: string): { r: number; g: number; b: number } {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
