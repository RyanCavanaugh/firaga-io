import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

/**
 * Generate a 3MF file with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, filename: string) {
    const { partList, pixels, width, height } = image;
    
    // Create XML content for 3MF
    const xmlns = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';
    const xmlnsMaterial = 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02';
    
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="${xmlns}" xmlns:m="${xmlnsMaterial}">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        const color = rgbToHex(r, g, b);
        modelXml += `\n            <base name="${escapeXml(part.target.name)}" displaycolor="${color}" />`;
    });
    
    modelXml += `
        </basematerials>`;
    
    // Create mesh objects for each color layer
    let objectId = 2;
    const objectIds: number[] = [];
    
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        // Find all pixels of this color and create a heightmap
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a small cube for this pixel
                    const x0 = x, x1 = x + 1;
                    const y0 = y, y1 = y + 1;
                    const z0 = colorIdx * 0.5; // Stack colors slightly
                    const z1 = z0 + 0.5;
                    
                    // Add vertices for the cube
                    const baseIdx = vertices.length;
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );
                    
                    // Add triangles for the cube faces
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXml += `\n        <object id="${objectId}" type="model">
            <mesh>
                <vertices>`;
            
            vertices.forEach(([x, y, z]) => {
                modelXml += `\n                    <vertex x="${x}" y="${y}" z="${z}" />`;
            });
            
            modelXml += `
                </vertices>
                <triangles>`;
            
            triangles.forEach(([v1, v2, v3]) => {
                modelXml += `\n                    <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />`;
            });
            
            modelXml += `
                </triangles>
            </mesh>
        </object>`;
            
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    modelXml += `
    </resources>
    <build>`;
    
    objectIds.forEach(id => {
        modelXml += `\n        <item objectid="${id}" />`;
    });
    
    modelXml += `
    </build>
</model>`;
    
    // Create the 3MF package (simplified - just the model file)
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Generate a ZIP file with OpenSCAD masks
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    const { partList, pixels, width, height } = image;
    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    
    // Create a monochrome image for each color
    partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        canvas.toBlob((blob) => {
            if (blob) {
                const colorName = sanitizeFilename(part.target.name);
                zip.file(`${colorName}_${colorIdx}.png`, blob);
            }
        });
    });
    
    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image: ${filename}
// Size: ${width}x${height}

`;
    
    partList.forEach((part, colorIdx) => {
        const colorName = sanitizeFilename(part.target.name);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadContent += `// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIdx * 0.5}])
surface(file = "${colorName}_${colorIdx}.png", center = true, invert = true);

`;
    });
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download the zip file
    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        saveAs(content, `${filename}_openscad.zip`);
    });
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}
