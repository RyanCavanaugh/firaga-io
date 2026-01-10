import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type Export3DSettings = {
    format: "3mf" | "openscad";
    filename: string;
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings.filename);
    } else {
        await exportOpenSCAD(image, settings.filename);
    }
}

async function export3MF(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create 3MF model XML
    const modelXML = generate3MFModel(image);
    zip.file("3D/3dmodel.model", modelXML);
    
    // Create content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.file("_rels/.rels", rels);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
}

function generate3MFModel(image: PartListImage): string {
    const pixelHeight = 0.5;
    const pixelSize = 1.0;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `
            <base name="${part.target.name}" displaycolor="#${color}FF"/>`;
    });
    
    xml += `
        </basematerials>`;
    
    // Create separate object for each color
    let objectId = 2;
    const objects: string[] = [];
    
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices for cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    const v = vertexIndex;
                    // 12 triangles for cube (2 per face)
                    // Bottom
                    triangles.push(`<triangle v1="${v+0}" v2="${v+2}" v3="${v+1}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+3}" v3="${v+2}"/>`);
                    // Top
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}"/>`);
                    // Front
                    triangles.push(`<triangle v1="${v+0}" v2="${v+1}" v3="${v+5}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+5}" v3="${v+4}"/>`);
                    // Back
                    triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}"/>`);
                    // Left
                    triangles.push(`<triangle v1="${v+3}" v2="${v+0}" v3="${v+4}"/>`);
                    triangles.push(`<triangle v1="${v+3}" v2="${v+4}" v3="${v+7}"/>`);
                    // Right
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}"/>`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `
        <object id="${objectId}" type="model">
            <mesh>
                <vertices>
${vertices.join('\n')}
                </vertices>
                <triangles>
${triangles.join('\n')}
                </triangles>
            </mesh>
        </object>`;
            objects.push(`<component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>`);
            objectId++;
        }
    });
    
    xml += `
    </resources>
    <build>
        <item objectid="2"/>
    </build>
</model>`;
    
    return xml;
}

async function exportOpenSCAD(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one mask image per color
    image.partList.forEach((part, colorIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with black background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw white pixels where this color appears
        ctx.fillStyle = "#FFFFFF";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG data URL and add to zip
        const dataURL = canvas.toDataURL("image/png");
        const base64Data = dataURL.split(",")[1];
        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        zip.file(`mask_${colorIdx}_${sanitizedName}.png`, base64Data, { base64: true });
    });
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.zip`);
}

function generateOpenSCADFile(image: PartListImage): string {
    let scad = `// Generated by firaga.io
// 3D pixel art display

$fn = 20;
pixel_size = 1;
pixel_height = 0.5;

`;
    
    image.partList.forEach((part, colorIdx) => {
        const color = colorEntryToHex(part.target);
        const r = parseInt(color.substring(1, 3), 16) / 255;
        const g = parseInt(color.substring(3, 5), 16) / 255;
        const b = parseInt(color.substring(5, 7), 16) / 255;
        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        
        scad += `// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    surface(file = "mask_${colorIdx}_${sanitizedName}.png", center = false, invert = true)
        scale([pixel_size, pixel_size, pixel_height / 255]);

`;
    });
    
    return scad;
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
    return new Promise<void>((resolve) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve();
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve();
        }
    });
}
