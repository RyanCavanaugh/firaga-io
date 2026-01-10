import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    pitch: number;
    height: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCAD(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    // Load JSZip if needed (3MF is a zip file)
    await loadJSZip();

    const zip = new JSZip();
    
    // Create 3MF structure
    const modelXml = generate3MFModel(image, settings);
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

    // Build the zip structure
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.folder("_rels").file(".rels", relsXml);
    zip.folder("3D").file("3dmodel.model", modelXml);

    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        xml += `\n            <base name="${escapeXml(color.name)}" displaycolor="${hexColor}" />`;
    }
    
    xml += `\n        </basematerials>`;
    
    // Create a mesh object for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        xml += `\n        <object id="${colorIndex + 2}" type="model">
            <mesh>
                <vertices>`;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // Add 8 vertices for a cube
                    const baseIdx = vertexIndex;
                    vertices.push(`\n                    <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`\n                    <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`\n                    <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`\n                    <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`\n                    <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`\n                    <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`\n                    <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`\n                    <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    vertexIndex += 8;
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`\n                    <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`\n                    <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`\n                    <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`\n                    <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`\n                    <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`\n                    <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`\n                    <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`\n                    <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face
                    triangles.push(`\n                    <triangle v1="${baseIdx + 3}" v2="${baseIdx}" v3="${baseIdx + 4}" />`);
                    triangles.push(`\n                    <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face
                    triangles.push(`\n                    <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`\n                    <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                }
            }
        }
        
        xml += vertices.join('');
        xml += `\n                </vertices>
                <triangles>`;
        xml += triangles.join('');
        xml += `\n                </triangles>
            </mesh>
        </object>`;
    }
    
    xml += `\n    </resources>
    <build>`;
    
    // Add each color mesh to the build
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        xml += `\n        <item objectid="${colorIndex + 2}" partnumber="${escapeXml(image.partList[colorIndex].target.name)}" />`;
    }
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZip();
    
    const zip = new JSZip();
    const { pitch, height } = settings;
    
    // Generate one black/white PNG per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const sanitizedName = sanitizeFilename(color.target.name);
        zip.file(`${sanitizedName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image: ${settings.filename}
// Pitch: ${pitch}mm
// Height: ${height}mm

`;
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex].target;
        const sanitizedName = sanitizeFilename(color.name);
        const hexColor = rgbToHex(color.r, color.g, color.b);
        
        scadContent += `// ${color.name} (${hexColor})
color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])
    linear_extrude(height=${height})
        scale([${pitch}, ${pitch}])
            surface(file="${sanitizedName}.png", invert=true, center=false);

`;
    }
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex.toUpperCase();
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        await new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
