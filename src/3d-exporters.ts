import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: any;

export type ThreeDExportFormat = "3mf" | "openscad-masks";

export interface ThreeDExportSettings {
    format: ThreeDExportFormat;
    pixelHeight: number; // Height of each pixel in mm
    baseThickness: number; // Thickness of base layer in mm
}

export async function export3D(image: PartListImage, settings: ThreeDExportSettings, filename: string) {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        await export3MF(image, settings, filename);
    } else if (settings.format === "openscad-masks") {
        await exportOpenSCADMasks(image, settings, filename);
    }
}

async function loadJSZip() {
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
    }
}

async function export3MF(image: PartListImage, settings: ThreeDExportSettings, filename: string) {
    const zip = new JSZip();
    
    // Create the 3MF package structure
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    
    // Build the 3D model
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const r = Math.round(color.r);
        const g = Math.round(color.g);
        const b = Math.round(color.b);
        modelXml += `
            <base name="${color.name}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}FF"/>`;
    }
    
    modelXml += `
        </basematerials>`;
    
    // Create separate mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = settings.pixelHeight;
                    
                    // 8 vertices of the box
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    const v = vertexIndex;
                    // 12 triangles (2 per face, 6 faces) with material reference
                    const matId = colorIndex;
                    // Bottom
                    triangles.push(`<triangle v1="${v+0}" v2="${v+2}" v3="${v+1}" pid="1" p1="${matId}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+3}" v3="${v+2}" pid="1" p1="${matId}"/>`);
                    // Top
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" pid="1" p1="${matId}"/>`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" pid="1" p1="${matId}"/>`);
                    // Front
                    triangles.push(`<triangle v1="${v+0}" v2="${v+1}" v3="${v+5}" pid="1" p1="${matId}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+5}" v3="${v+4}" pid="1" p1="${matId}"/>`);
                    // Back
                    triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}" pid="1" p1="${matId}"/>`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}" pid="1" p1="${matId}"/>`);
                    // Left
                    triangles.push(`<triangle v1="${v+0}" v2="${v+4}" v3="${v+7}" pid="1" p1="${matId}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+7}" v3="${v+3}" pid="1" p1="${matId}"/>`);
                    // Right
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" pid="1" p1="${matId}"/>`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" pid="1" p1="${matId}"/>`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXml += `
        <object id="${objectId}" type="model">
            <mesh>
                <vertices>
                    ${vertices.join('\n                    ')}
                </vertices>
                <triangles>
                    ${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`;
            objectIds.push(objectId);
            objectId++;
        }
    }
    
    modelXml += `
    </resources>
    <build>`;
    
    // Add all objects to the build with their materials
    for (let i = 0; i < objectIds.length; i++) {
        modelXml += `
        <item objectid="${objectIds[i]}" partnumber="${i}"/>`;
    }
    
    modelXml += `
    </build>
</model>`;
    
    // Add files to zip
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.folder("_rels").file(".rels", relsXml);
    zip.folder("3D").file("3dmodel.model", modelXml);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename}.3mf`);
}

async function exportOpenSCADMasks(image: PartListImage, settings: ThreeDExportSettings, filename: string) {
    const zip = new JSZip();
    
    // Create a mask image for each color
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const scadParts: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        
        // Create black and white mask
        const imageData = ctx.createImageData(image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const i = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                const value = isThisColor ? 255 : 0;
                imageData.data[i] = value;
                imageData.data[i + 1] = value;
                imageData.data[i + 2] = value;
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const colorName = sanitizeFilename(color.target.name);
        const maskFilename = `mask_${colorIndex}_${colorName}.png`;
        zip.file(maskFilename, blob);
        
        // Add to OpenSCAD code
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        scadParts.push(`
// ${color.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIndex * settings.pixelHeight}])
surface(file = "${maskFilename}", center = true, invert = true)
scale([1, 1, ${settings.pixelHeight}]);
`);
    }
    
    // Create the OpenSCAD file
    const scadContent = `// Generated by firaga.io
// Image: ${filename}
// Size: ${image.width} x ${image.height}

$fn = 50;

${scadParts.join('\n')}
`;
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename}_openscad.zip`);
}

function toHex(n: number): string {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_');
}
