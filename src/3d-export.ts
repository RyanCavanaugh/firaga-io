import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ExportFormat = "3mf" | "openscad";

export interface Export3DSettings {
    format: ExportFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    pixelSize: number; // Width/depth of each pixel in mm
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
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

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    // Create 3MF structure
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    
    zip.folder("_rels").file(".rels", rels);
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create 3D model
    const model = generate3MFModel(image, settings);
    zip.folder("3D").file("3dmodel.model", model);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: Export3DSettings): string {
    const { pixelSize, pixelHeight } = settings;
    
    let modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        modelXML += `      <base name="${color.name}" displaycolor="#${hex}" />\n`;
    });
    
    modelXML += `    </basematerials>\n`;
    
    // Create meshes for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate cube for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    const baseIdx = vertexCount;
                    
                    // 8 vertices of cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXML += `    <object id="${colorIdx + 2}" type="model">\n`;
            modelXML += `      <mesh>\n`;
            modelXML += `        <vertices>\n`;
            modelXML += vertices.join('\n') + '\n';
            modelXML += `        </vertices>\n`;
            modelXML += `        <triangles>\n`;
            modelXML += triangles.join('\n') + '\n';
            modelXML += `        </triangles>\n`;
            modelXML += `      </mesh>\n`;
            modelXML += `    </object>\n`;
        }
    });
    
    modelXML += `  </resources>\n`;
    modelXML += `  <build>\n`;
    
    // Add all objects to build
    image.partList.forEach((part, colorIdx) => {
        modelXML += `    <item objectid="${colorIdx + 2}" />\n`;
    });
    
    modelXML += `  </build>\n`;
    modelXML += `</model>`;
    
    return modelXML;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    const { pixelSize, pixelHeight } = settings;
    
    // Create a black/white image for each color
    const promises: Promise<void>[] = [];
    
    image.partList.forEach((part, colorIdx) => {
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
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                    zip.file(`${colorName}.png`, blob);
                }
                resolve();
            });
        });
        
        promises.push(promise);
    });
    
    await Promise.all(promises);
    
    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel size: ${pixelSize}mm x ${pixelSize}mm
// Pixel height: ${pixelHeight}mm

`;
    
    image.partList.forEach((part) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadContent += `// ${part.target.name}\n`;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])\n`;
        scadContent += `    surface(file = "${colorName}.png", center = true, invert = true);\n\n`;
    });
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
