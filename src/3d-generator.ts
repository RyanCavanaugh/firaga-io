import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    layerHeight: number;
    baseHeight: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    await load3DLibraries();
    
    if (settings.format === "3mf") {
        await generate3MF(image, settings, filename);
    } else {
        await generateOpenSCAD(image, settings, filename);
    }
}

async function load3DLibraries(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    } else {
        return Promise.resolve();
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file("[Content_Types].xml", generateContentTypes());
    zip.file("_rels/.rels", generateRels());
    
    // Generate 3D model XML
    const modelXml = generate3DModelXML(image, settings);
    zip.file("3D/3dmodel.model", modelXml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
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

function generate3DModelXML(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const { layerHeight, baseHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `\n            <base name="${color.name}" displaycolor="#${hexColor}"/>`;
    });
    
    xml += `\n        </basematerials>`;
    
    // Generate mesh for each color
    partList.forEach((part, colorIdx) => {
        const meshId = colorIdx + 2;
        xml += `\n        <object id="${meshId}" type="model">
            <mesh>
                <vertices>`;
        
        const vertices: Array<readonly [number, number, number]> = [];
        const triangles: Array<readonly [number, number, number]> = [];
        
        // Build heightmap mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a raised block for this pixel
                    addBlockVerticesAndTriangles(x, y, baseHeight, layerHeight, vertices, triangles);
                }
            }
        }
        
        // Output vertices
        vertices.forEach(v => {
            xml += `\n                    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`;
        });
        
        xml += `\n                </vertices>
                <triangles>`;
        
        // Output triangles
        triangles.forEach(t => {
            xml += `\n                    <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}"/>`;
        });
        
        xml += `\n                </triangles>
            </mesh>
        </object>`;
    });
    
    xml += `\n    </resources>
    <build>`;
    
    // Add all objects to build
    partList.forEach((_, idx) => {
        const objId = idx + 2;
        xml += `\n        <item objectid="${objId}"/>`;
    });
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

function addBlockVerticesAndTriangles(
    x: number,
    y: number,
    baseZ: number,
    height: number,
    vertices: Array<readonly [number, number, number]>,
    triangles: Array<readonly [number, number, number]>
): void {
    const baseIdx = vertices.length;
    const topZ = baseZ + height;
    
    // Add 8 vertices for a cube
    // Bottom face
    vertices.push([x, y, baseZ] as const);
    vertices.push([x + 1, y, baseZ] as const);
    vertices.push([x + 1, y + 1, baseZ] as const);
    vertices.push([x, y + 1, baseZ] as const);
    // Top face
    vertices.push([x, y, topZ] as const);
    vertices.push([x + 1, y, topZ] as const);
    vertices.push([x + 1, y + 1, topZ] as const);
    vertices.push([x, y + 1, topZ] as const);
    
    // Add 12 triangles (2 per face, 6 faces)
    // Bottom
    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1] as const);
    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2] as const);
    // Top
    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6] as const);
    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7] as const);
    // Front
    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5] as const);
    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4] as const);
    // Back
    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7] as const);
    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6] as const);
    // Left
    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4] as const);
    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7] as const);
    // Right
    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6] as const);
    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5] as const);
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    const { layerHeight, baseHeight } = settings;
    
    // Generate mask images for each color
    const maskPromises = partList.map(async (part, colorIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with black
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        
        // Draw white pixels where this color appears
        ctx.fillStyle = "#FFFFFF";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        return { name: `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`, blob };
    });
    
    const masks = await Promise.all(maskPromises);
    
    // Add mask images to zip
    masks.forEach(mask => {
        zip.file(mask.name, mask.blob);
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// 3D representation of pixel art

`;
    
    partList.forEach((part, idx) => {
        const maskFile = masks[idx].name;
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadContent += `
// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${baseHeight}])
scale([1, 1, ${layerHeight}])
surface(file = "${maskFile}", center = true, invert = false);
`;
    });
    
    zip.file(`${filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
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
