import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as FileSaver from 'file-saver';

export type Export3DSettings = {
    format: "3mf" | "openscad";
    filename: string;
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings.filename);
    } else if (settings.format === "openscad") {
        await exportOpenSCAD(image, settings.filename);
    }
}

async function export3MF(image: PartListImage, filename: string) {
    const JSZip = await importJSZip();
    const zip = new JSZip();
    
    // Create 3MF package structure
    const modelXml = generate3MFModel(image);
    const relsXml = generate3MFRels();
    const contentTypesXml = generate3MFContentTypes();
    
    zip.file("3D/3dmodel.model", modelXml);
    zip.file("_rels/.rels", relsXml);
    zip.file("[Content_Types].xml", contentTypesXml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(blob, `${filename}.3mf`);
}

function generate3MFModel(image: PartListImage): string {
    const height = 0.5; // Height of each pixel in mm
    const pixelSize = 2.5; // Size of each pixel in mm (standard bead size)
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((entry, idx) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove # prefix
        xml += `\n      <base name="${entry.target.name}" displaycolor="#${color}" />`;
    });
    
    xml += `\n    </basematerials>`;
    
    // Generate mesh for each color
    image.partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexCount;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `\n    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n          ')}
        </vertices>
        <triangles>
${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `\n  </resources>
  <build>`;
    
    // Add build items for each color object with material
    image.partList.forEach((entry, colorIdx) => {
        xml += `\n    <item objectid="${colorIdx + 2}" partnumber="${colorIdx}" />`;
    });
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

function generate3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function generate3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

async function exportOpenSCAD(image: PartListImage, filename: string) {
    const JSZip = await importJSZip();
    const zip = new JSZip();
    
    // Create monochrome image for each color
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const scadLines: string[] = [];
    scadLines.push("// Generated by firaga.io");
    scadLines.push("// OpenSCAD heightmap display");
    scadLines.push("");
    scadLines.push("pixel_size = 2.5; // mm");
    scadLines.push("height = 0.5; // mm");
    scadLines.push("");
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        
        // Create black and white image
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isColor = image.pixels[y][x] === colorIdx;
                const value = isColor ? 255 : 0;
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to PNG blob
        const pngDataUrl = canvas.toDataURL("image/png");
        const pngData = pngDataUrl.split(",")[1]; // Remove data:image/png;base64,
        const pngBlob = base64ToBlob(pngData, "image/png");
        
        const safeName = entry.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const imgFilename = `color_${colorIdx}_${safeName}.png`;
        
        zip.file(imgFilename, pngBlob);
        
        // Add to SCAD file
        const color = colorEntryToHex(entry.target);
        const r = parseInt(color.substring(1, 3), 16) / 255;
        const g = parseInt(color.substring(3, 5), 16) / 255;
        const b = parseInt(color.substring(5, 7), 16) / 255;
        
        scadLines.push(`// ${entry.target.name}`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  scale([pixel_size, pixel_size, height])`);
        scadLines.push(`    surface(file = "${imgFilename}", center = false, invert = true);`);
        scadLines.push("");
    }
    
    zip.file("model.scad", scadLines.join("\n"));
    
    const blob = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(blob, `${filename}_openscad.zip`);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

async function importJSZip(): Promise<any> {
    // Load JSZip from CDN
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.onerror = reject;
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve((window as any).JSZip);
        }
    });
}
