import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: typeof import("jszip");

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
}

export async function export3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings.filename);
    } else if (settings.format === "openscad-masks") {
        await exportOpenSCADMasks(image, settings.filename);
    }
}

async function export3MF(image: PartListImage, filename: string) {
    // Generate 3MF file with triangle mesh
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MFContent(image: PartListImage): string {
    const voxelSize = 1.0; // 1mm per pixel
    const height = 2.0; // 2mm height for each pixel
    
    let vertices: string[] = [];
    let triangles: string[] = [];
    let vertexIndex = 0;
    
    const materials: string[] = [];
    const objectsByColor: Map<number, { vertices: string[], triangles: string[] }> = new Map();
    
    // Create separate objects for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        objectsByColor.set(partIndex, { vertices: [], triangles: [] });
    }
    
    // Generate mesh for each pixel
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const partIndex = image.pixels[y][x];
            if (partIndex === -1) continue; // Skip transparent pixels
            
            const obj = objectsByColor.get(partIndex)!;
            const localVertexIndex = obj.vertices.length / 3;
            
            // Create a box (cuboid) for this pixel
            const x0 = x * voxelSize;
            const x1 = (x + 1) * voxelSize;
            const y0 = y * voxelSize;
            const y1 = (y + 1) * voxelSize;
            const z0 = 0;
            const z1 = height;
            
            // 8 vertices of the box
            const boxVertices = [
                `${x0} ${y0} ${z0}`, `${x1} ${y0} ${z0}`, `${x1} ${y1} ${z0}`, `${x0} ${y1} ${z0}`, // bottom
                `${x0} ${y0} ${z1}`, `${x1} ${y0} ${z1}`, `${x1} ${y1} ${z1}`, `${x0} ${y1} ${z1}`  // top
            ];
            
            obj.vertices.push(...boxVertices);
            
            // 12 triangles (2 per face, 6 faces)
            const vi = localVertexIndex;
            const faces = [
                // bottom
                [vi, vi + 2, vi + 1], [vi, vi + 3, vi + 2],
                // top
                [vi + 4, vi + 5, vi + 6], [vi + 4, vi + 6, vi + 7],
                // front
                [vi, vi + 1, vi + 5], [vi, vi + 5, vi + 4],
                // back
                [vi + 2, vi + 3, vi + 7], [vi + 2, vi + 7, vi + 6],
                // left
                [vi, vi + 4, vi + 7], [vi, vi + 7, vi + 3],
                // right
                [vi + 1, vi + 2, vi + 6], [vi + 1, vi + 6, vi + 5]
            ];
            
            for (const face of faces) {
                obj.triangles.push(`<triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}" />`);
            }
        }
    }
    
    // Build materials section
    let materialsXml = '';
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        materialsXml += `    <base name="${escapeXml(color.name)}" displaycolor="#${r}${g}${b}" />\n`;
        materials.push(`${i}`);
    }
    
    // Build objects section
    let objectsXml = '';
    let objectRefs = '';
    for (let i = 0; i < image.partList.length; i++) {
        const obj = objectsByColor.get(i)!;
        if (obj.vertices.length === 0) continue; // Skip unused colors
        
        objectsXml += `  <object id="${i + 1}" type="model">\n`;
        objectsXml += `    <mesh>\n`;
        objectsXml += `      <vertices>\n`;
        for (const v of obj.vertices) {
            objectsXml += `        <vertex x="${v.split(' ')[0]}" y="${v.split(' ')[1]}" z="${v.split(' ')[2]}" />\n`;
        }
        objectsXml += `      </vertices>\n`;
        objectsXml += `      <triangles>\n`;
        for (const t of obj.triangles) {
            objectsXml += `        ${t}\n`;
        }
        objectsXml += `      </triangles>\n`;
        objectsXml += `    </mesh>\n`;
        objectsXml += `  </object>\n`;
        
        objectRefs += `    <item objectid="${i + 1}" />\n`;
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
${materialsXml}    </basematerials>
${objectsXml}  </resources>
  <build>
${objectRefs}  </build>
</model>`;
    
    return xml;
}

function escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    // Load JSZip dynamically
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one black/white image per color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelIndex = image.pixels[y][x];
                const isThisColor = pixelIndex === partIndex;
                const value = isThisColor ? 255 : 0; // white for this color, black otherwise
                
                const idx = (y * image.width + x) * 4;
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            maskCanvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const colorName = image.partList[partIndex].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${partIndex}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}.zip`);
}

function generateOpenSCADFile(image: PartListImage): string {
    const voxelSize = 1.0; // 1mm per pixel
    const heightPerLevel = 2.0; // 2mm height
    
    let scadContent = `// OpenSCAD file for 3D pixel art
// Generated by firaga.io
// Width: ${image.width}, Height: ${image.height}

`;
    
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const colorName = image.partList[partIndex].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = image.partList[partIndex].target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadContent += `// ${image.partList[partIndex].target.name}\n`;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  surface(file="mask_${partIndex}_${colorName}.png", center=true, invert=true);\n\n`;
    }
    
    scadContent += `// Alternative: using linear_extrude with height map\n`;
    scadContent += `// Adjust the scale and height as needed\n`;
    
    return scadContent;
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
