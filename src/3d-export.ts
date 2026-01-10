import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3DFormat = "3mf" | "openscad";

export type Export3DSettings = {
    format: Export3DFormat;
    height: number;
    baseThickness: number;
    filename: string;
};

export function export3D(image: PartListImage, settings: Export3DSettings): void {
    if (settings.format === "3mf") {
        export3MF(image, settings);
    } else {
        exportOpenSCAD(image, settings);
    }
}

function export3MF(image: PartListImage, settings: Export3DSettings): void {
    const { width, height, pixels, partList } = image;
    const pixelSize = 1.0; // 1mm per pixel
    const layerHeight = settings.height;
    const baseThickness = settings.baseThickness;
    
    let meshXML = '';
    let resourcesXML = '';
    let buildItemsXML = '';
    let objectId = 1;
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const hexColor = colorEntryToHex(color.target);
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build vertices and faces for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = layerHeight;
                    
                    const baseIdx = vertices.length;
                    
                    // 8 vertices of the box
                    vertices.push([x0, y0, z0]); // 0
                    vertices.push([x1, y0, z0]); // 1
                    vertices.push([x1, y1, z0]); // 2
                    vertices.push([x0, y1, z0]); // 3
                    vertices.push([x0, y0, z1]); // 4
                    vertices.push([x1, y0, z1]); // 5
                    vertices.push([x1, y1, z1]); // 6
                    vertices.push([x0, y1, z1]); // 7
                    
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
                    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6]);
                    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2]);
                    // Left face
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length === 0) continue;
        
        // Build mesh XML
        let meshContent = '<mesh>\n<vertices>\n';
        for (const [x, y, z] of vertices) {
            meshContent += `<vertex x="${x}" y="${y}" z="${z}" />\n`;
        }
        meshContent += '</vertices>\n<triangles>\n';
        for (const [v1, v2, v3] of triangles) {
            meshContent += `<triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        }
        meshContent += '</triangles>\n</mesh>';
        
        resourcesXML += `<object id="${objectId}" type="model">\n${meshContent}\n</object>\n`;
        
        // Parse hex color
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        buildItemsXML += `<item objectid="${objectId}" />\n`;
        resourcesXML += `<basematerials id="${objectId + 1000}">\n`;
        resourcesXML += `<base name="${color.target.name}" displaycolor="#${hexColor.slice(1)}" />\n`;
        resourcesXML += `</basematerials>\n`;
        
        objectId++;
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<resources>
${resourcesXML}
</resources>
<build>
${buildItemsXML}
</build>
</model>`;
    
    downloadFile(xml, `${settings.filename}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const JSZip = await importJSZip();
    const zip = new JSZip();
    
    // Create one B&W PNG per color
    const pngPromises: Array<Promise<void>> = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);
        
        // Fill with white background, black for pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isThisColor = pixels[y][x] === colorIdx;
                imageData.data[idx] = isThisColor ? 0 : 255;     // R
                imageData.data[idx + 1] = isThisColor ? 0 : 255; // G
                imageData.data[idx + 2] = isThisColor ? 0 : 255; // B
                imageData.data[idx + 3] = 255;                    // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const pngPromise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`, blob);
                }
                resolve();
            });
        });
        
        pngPromises.push(pngPromise);
    }
    
    await Promise.all(pngPromises);
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Heightmap-based 3D model

`;
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const filename = `color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`;
        const hexColor = colorEntryToHex(color.target);
        
        scadContent += `// ${color.target.name} (${hexColor})
color("${hexColor}")
translate([0, 0, ${colorIdx * settings.height}])
surface(file = "${filename}", center = true, invert = true);

`;
    }
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download the zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.filename}_openscad.zip`;
    a.click();
    URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function importJSZip(): Promise<any> {
    // Dynamically import JSZip
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    document.head.appendChild(script);
    
    return new Promise((resolve) => {
        script.onload = () => {
            resolve((window as any).JSZip);
        };
    });
}
