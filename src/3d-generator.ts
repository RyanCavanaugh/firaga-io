import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad';

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    pixelWidth: number;
    baseHeight: number;
}

export async function export3D(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings, filename);
    } else {
        await exportOpenSCAD(image, settings, filename);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const materials: string[] = [];
    const meshes: string[] = [];
    
    // Build materials section
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        materials.push(`    <base:displaycolor color="#${hex}"/>`);
    });
    
    // Build geometry for each color
    const geometries: string[] = [];
    const items: string[] = [];
    
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        let vertexCount = 0;
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseX = x * settings.pixelWidth;
                    const baseY = y * settings.pixelHeight;
                    const baseZ = 0;
                    const topZ = settings.baseHeight;
                    
                    // Create a box (8 vertices, 12 triangles)
                    const v0 = vertexCount;
                    vertices.push([baseX, baseY, baseZ]);
                    vertices.push([baseX + settings.pixelWidth, baseY, baseZ]);
                    vertices.push([baseX + settings.pixelWidth, baseY + settings.pixelHeight, baseZ]);
                    vertices.push([baseX, baseY + settings.pixelHeight, baseZ]);
                    vertices.push([baseX, baseY, topZ]);
                    vertices.push([baseX + settings.pixelWidth, baseY, topZ]);
                    vertices.push([baseX + settings.pixelWidth, baseY + settings.pixelHeight, topZ]);
                    vertices.push([baseX, baseY + settings.pixelHeight, topZ]);
                    
                    // Bottom face
                    triangles.push([v0, v0 + 2, v0 + 1]);
                    triangles.push([v0, v0 + 3, v0 + 2]);
                    // Top face
                    triangles.push([v0 + 4, v0 + 5, v0 + 6]);
                    triangles.push([v0 + 4, v0 + 6, v0 + 7]);
                    // Front face
                    triangles.push([v0, v0 + 1, v0 + 5]);
                    triangles.push([v0, v0 + 5, v0 + 4]);
                    // Right face
                    triangles.push([v0 + 1, v0 + 2, v0 + 6]);
                    triangles.push([v0 + 1, v0 + 6, v0 + 5]);
                    // Back face
                    triangles.push([v0 + 2, v0 + 3, v0 + 7]);
                    triangles.push([v0 + 2, v0 + 7, v0 + 6]);
                    // Left face
                    triangles.push([v0 + 3, v0, v0 + 4]);
                    triangles.push([v0 + 3, v0 + 4, v0 + 7]);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = colorIdx + 1;
            const vertexStr = vertices.map(v => `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`).join('\n');
            const triangleStr = triangles.map(t => `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('\n');
            
            geometries.push(`  <object id="${meshId}" type="model">
    <mesh>
      <vertices>
${vertexStr}
      </vertices>
      <triangles>
${triangleStr}
      </triangles>
    </mesh>
  </object>`);
            
            items.push(`    <item objectid="${meshId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>`);
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${geometries.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`;
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Create one PNG per color
    const imagePromises = image.partList.map(async (part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Create black/white mask
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                const value = isThisColor ? 255 : 0;
                
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const blob = await new Promise<Blob | null>(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        if (blob) {
            zip.file(`color_${colorIdx}_${part.symbol}.png`, blob);
        }
    });
    
    await Promise.all(imagePromises);
    
    // Create OpenSCAD file
    const scadParts = image.partList.map((part, colorIdx) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        return `// ${part.target.name} (${part.symbol}) - ${part.count} pixels
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIdx * settings.baseHeight}])
linear_extrude(height=${settings.baseHeight})
scale([${settings.pixelWidth}, ${settings.pixelHeight}])
surface(file="color_${colorIdx}_${part.symbol}.png", center=false, invert=true);`;
    }).join('\n\n');
    
    const scadFile = `// Generated by firaga.io
// Image: ${filename}
// Size: ${image.width}x${image.height}
// Colors: ${image.partList.length}

${scadParts}
`;
    
    zip.file(`${filename}.scad`, scadFile);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

async function loadJSZip(): Promise<any> {
    const tagName = 'jszip-script-tag';
    const existingScript = document.getElementById(tagName);
    
    if (existingScript) {
        return (window as any).JSZip;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = tagName;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
