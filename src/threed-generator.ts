import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as FileSaver from "file-saver";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings.filename);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings.filename);
    }
}

async function generate3MF(image: PartListImage, filename: string): Promise<void> {
    
    const width = image.width;
    const height = image.height;
    const depth = 1.0;
    
    let vertexId = 1;
    const meshes: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x;
                    const y0 = y;
                    const x1 = x + 1;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = depth;
                    
                    const baseId = localVertexId;
                    
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 1}" v3="${baseId + 2}" />`);
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 2}" v3="${baseId + 3}" />`);
                    triangles.push(`<triangle v1="${baseId + 4}" v2="${baseId + 6}" v3="${baseId + 5}" />`);
                    triangles.push(`<triangle v1="${baseId + 4}" v2="${baseId + 7}" v3="${baseId + 6}" />`);
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 4}" v3="${baseId + 5}" />`);
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 5}" v3="${baseId + 1}" />`);
                    triangles.push(`<triangle v1="${baseId + 1}" v2="${baseId + 5}" v3="${baseId + 6}" />`);
                    triangles.push(`<triangle v1="${baseId + 1}" v2="${baseId + 6}" v3="${baseId + 2}" />`);
                    triangles.push(`<triangle v1="${baseId + 2}" v2="${baseId + 6}" v3="${baseId + 7}" />`);
                    triangles.push(`<triangle v1="${baseId + 2}" v2="${baseId + 7}" v3="${baseId + 3}" />`);
                    triangles.push(`<triangle v1="${baseId + 3}" v2="${baseId + 7}" v3="${baseId + 4}" />`);
                    triangles.push(`<triangle v1="${baseId + 3}" v2="${baseId + 4}" v3="${baseId + 0}" />`);
                    
                    localVertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const hex = colorEntryToHex(part.target).substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            meshes.push(`
    <object id="${vertexId}" name="${part.target.name}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>
    <item objectid="${vertexId}" transform="1 0 0 0 1 0 0 0 1 0 0 0">
      <metadatagroup>
        <metadata name="color">#${hex}</metadata>
      </metadatagroup>
    </item>`);
            
            vertexId++;
        }
    }
    
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${meshes.join('\n')}
  </resources>
  <build>
  </build>
</model>`;
    
    const blob = new Blob([content], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    FileSaver.saveAs(blob, `${filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    // JSZip needs to be loaded dynamically via script tag since it's not in package.json
    const JSZip = await loadJSZip();
    
    const zip = new JSZip();
    const width = image.width;
    const height = image.height;
    
    const scadParts: string[] = [];
    scadParts.push(`// Generated by firaga.io`);
    scadParts.push(`// Image size: ${width}x${height}`);
    scadParts.push(``);
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }
        
        const maskFilename = `mask_${colorIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        zip.file(maskFilename, bytes);
        
        const hex = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        scadParts.push(`// ${part.target.name} (${part.count} pixels)`);
        scadParts.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadParts.push(`  translate([0, 0, ${colorIndex}])`);
        scadParts.push(`    surface(file = "${maskFilename}", center = true, invert = true);`);
        scadParts.push(``);
    }
    
    scadParts.push(`// Stack all layers`);
    
    zip.file('display.scad', scadParts.join('\n'));
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipBlob, `${filename}_openscad.zip`);
}

async function loadJSZip(): Promise<any> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.onerror = () => {
                reject(new Error("Failed to load JSZip"));
            };
            tag.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve((window as any).JSZip);
        }
    });
}
