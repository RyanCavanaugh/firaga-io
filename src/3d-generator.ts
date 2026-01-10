import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export async function export3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
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

async function export3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file("[Content_Types].xml", generateContentTypes());
    
    const relsFolder = zip.folder("_rels");
    relsFolder?.file(".rels", generateRels());
    
    const modelFolder = zip.folder("3D");
    const modelRelsFolder = modelFolder?.folder("_rels");
    modelRelsFolder?.file("3dmodel.model.rels", generateModelRels(image.partList.length));
    
    // Generate 3D model
    const modelXml = generate3DModel(image, settings);
    modelFolder?.file("3dmodel.model", modelXml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Generate one B/W image per color
    for (let i = 0; i < image.partList.length; i++) {
        const colorEntry = image.partList[i];
        const imageData = generateMaskImage(image, i);
        const blob = await canvasToBlob(imageData);
        zip.file(`color_${i}_${sanitizeFilename(colorEntry.target.name)}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generateModelRels(colorCount: number): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
}

function generate3DModel(image: PartListImage, settings: ThreeDSettings): string {
    const materials = image.partList.map((entry, idx) => {
        const hex = colorEntryToHex(entry.target).substring(1); // Remove #
        return `        <base:material name="${escapeXml(entry.target.name)}" displaycolor="#${hex}"/>`;
    }).join('\n');
    
    let vertexId = 0;
    const vertices: string[] = [];
    const triangles: string[] = [];
    
    // Generate mesh for each color separately
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const startVertex = vertexId;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube (box) for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = settings.pixelHeight;
                    
                    // 8 vertices for a box
                    const v = vertexId;
                    vertices.push(`            <vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`            <vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`            <vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`            <vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`            <vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`            <vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`            <vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`            <vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`            <triangle v1="${v+0}" v2="${v+2}" v3="${v+1}" pid="1" p1="${colorIdx}"/>`);
                    triangles.push(`            <triangle v1="${v+0}" v2="${v+3}" v3="${v+2}" pid="1" p1="${colorIdx}"/>`);
                    // Top face
                    triangles.push(`            <triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" pid="1" p1="${colorIdx}"/>`);
                    triangles.push(`            <triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" pid="1" p1="${colorIdx}"/>`);
                    // Front face
                    triangles.push(`            <triangle v1="${v+0}" v2="${v+1}" v3="${v+5}" pid="1" p1="${colorIdx}"/>`);
                    triangles.push(`            <triangle v1="${v+0}" v2="${v+5}" v3="${v+4}" pid="1" p1="${colorIdx}"/>`);
                    // Back face
                    triangles.push(`            <triangle v1="${v+2}" v2="${v+3}" v3="${v+7}" pid="1" p1="${colorIdx}"/>`);
                    triangles.push(`            <triangle v1="${v+2}" v2="${v+7}" v3="${v+6}" pid="1" p1="${colorIdx}"/>`);
                    // Left face
                    triangles.push(`            <triangle v1="${v+3}" v2="${v+0}" v3="${v+4}" pid="1" p1="${colorIdx}"/>`);
                    triangles.push(`            <triangle v1="${v+3}" v2="${v+4}" v3="${v+7}" pid="1" p1="${colorIdx}"/>`);
                    // Right face
                    triangles.push(`            <triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" pid="1" p1="${colorIdx}"/>`);
                    triangles.push(`            <triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" pid="1" p1="${colorIdx}"/>`);
                    
                    vertexId += 8;
                }
            }
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
    <resources>
        <base:basematerials id="1">
${materials}
        </base:basematerials>
        <object id="2" type="model">
            <mesh>
                <vertices>
${vertices.join('\n')}
                </vertices>
                <triangles>
${triangles.join('\n')}
                </triangles>
            </mesh>
        </object>
    </resources>
    <build>
        <item objectid="2"/>
    </build>
</model>`;
}

function generateMaskImage(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Cannot get canvas context");
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const lines: string[] = [
        `// Generated OpenSCAD file for ${settings.filename}`,
        `// Image size: ${image.width} x ${image.height}`,
        '',
        `pixel_height = ${settings.pixelHeight};`,
        `base_height = ${settings.baseHeight};`,
        '',
        'union() {'
    ];
    
    for (let i = 0; i < image.partList.length; i++) {
        const colorEntry = image.partList[i];
        const filename = `color_${i}_${sanitizeFilename(colorEntry.target.name)}.png`;
        const colorHex = colorEntryToHex(colorEntry.target);
        
        lines.push(`    // ${colorEntry.target.name} (${colorHex})`);
        lines.push(`    color("${colorHex}")`);
        lines.push(`    surface(file = "${filename}", center = true, invert = true);`);
        lines.push('');
    }
    
    lines.push('}');
    
    return lines.join('\n');
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to convert canvas to blob"));
            }
        }, 'image/png');
    });
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
