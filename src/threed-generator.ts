import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    heightPerLayer: number;
};

/**
 * Generate 3D output in the requested format
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        generateOpenSCADMasks(image, settings);
    } else {
        const _exhaustive: never = settings.format;
        throw new Error(`Unknown 3D format: ${_exhaustive}`);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const xml = build3MF(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

/**
 * Build the 3MF XML structure
 */
function build3MF(image: PartListImage, settings: ThreeDSettings): string {
    const xmlns = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';
    const materialNS = 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02';
    
    let meshes = '';
    let objects = '';
    let objectId = 1;
    
    // Build materials list
    const materials: string[] = [];
    const materialMap = new Map<number, number>();
    
    image.partList.forEach((part, idx) => {
        if (part.count > 0) {
            const r = part.target.r;
            const g = part.target.g;
            const b = part.target.b;
            const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            materials.push(`<m:base name="${escapeXml(part.target.name)}" displaycolor="${color}" />`);
            materialMap.set(idx, materials.length - 1);
        }
    });
    
    const materialsXml = materials.length > 0 
        ? `<m:basematerials id="1">\n${materials.join('\n')}\n</m:basematerials>` 
        : '';
    
    // For each color, create a mesh with all pixels of that color
    image.partList.forEach((part, partIdx) => {
        if (part.count === 0) return;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;
        
        const materialId = materialMap.get(partIdx);
        const height = settings.heightPerLayer;
        
        // Find all pixels with this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    // Create a cube at this position
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = height;
                    
                    const baseVertexId = vertexId;
                    
                    // 8 vertices of the cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face * 6 faces)
                    const pidAttr = materialId !== undefined ? ` pid="1" p1="${materialId}"` : '';
                    
                    // Bottom face
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 2}" v3="${baseVertexId + 1}"${pidAttr} />`);
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 3}" v3="${baseVertexId + 2}"${pidAttr} />`);
                    
                    // Top face
                    triangles.push(`<triangle v1="${baseVertexId + 4}" v2="${baseVertexId + 5}" v3="${baseVertexId + 6}"${pidAttr} />`);
                    triangles.push(`<triangle v1="${baseVertexId + 4}" v2="${baseVertexId + 6}" v3="${baseVertexId + 7}"${pidAttr} />`);
                    
                    // Front face
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 1}" v3="${baseVertexId + 5}"${pidAttr} />`);
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 5}" v3="${baseVertexId + 4}"${pidAttr} />`);
                    
                    // Back face
                    triangles.push(`<triangle v1="${baseVertexId + 2}" v2="${baseVertexId + 3}" v3="${baseVertexId + 7}"${pidAttr} />`);
                    triangles.push(`<triangle v1="${baseVertexId + 2}" v2="${baseVertexId + 7}" v3="${baseVertexId + 6}"${pidAttr} />`);
                    
                    // Left face
                    triangles.push(`<triangle v1="${baseVertexId + 3}" v2="${baseVertexId + 0}" v3="${baseVertexId + 4}"${pidAttr} />`);
                    triangles.push(`<triangle v1="${baseVertexId + 3}" v2="${baseVertexId + 4}" v3="${baseVertexId + 7}"${pidAttr} />`);
                    
                    // Right face
                    triangles.push(`<triangle v1="${baseVertexId + 1}" v2="${baseVertexId + 2}" v3="${baseVertexId + 6}"${pidAttr} />`);
                    triangles.push(`<triangle v1="${baseVertexId + 1}" v2="${baseVertexId + 6}" v3="${baseVertexId + 5}"${pidAttr} />`);
                    
                    vertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshXml = `<mesh>
<vertices>
${vertices.join('\n')}
</vertices>
<triangles>
${triangles.join('\n')}
</triangles>
</mesh>`;
            
            objects += `<object id="${objectId}" type="model"${materialId !== undefined ? ' pid="1" pindex="' + materialId + '"' : ''}>
${meshXml}
</object>\n`;
            objectId++;
        }
    });
    
    const buildItems = Array.from({ length: objectId - 1 }, (_, i) => 
        `<item objectid="${i + 1}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="${xmlns}" xmlns:m="${materialNS}">
<resources>
${materialsXml}
${objects}
</resources>
<build>
${buildItems}
</build>
</model>`;
}

/**
 * Generate an OpenSCAD masks ZIP file
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const height = settings.heightPerLayer;
    let scadContent = `// Generated by firaga.io
// Each color layer as a separate heightmap

`;
    
    // For each color, generate a black/white mask image
    image.partList.forEach((part, partIdx) => {
        if (part.count === 0) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG data
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const filename = `mask_${sanitizeFilename(part.target.name)}_${part.symbol}.png`;
        
        zip.file(filename, base64Data, { base64: true });
        
        // Add to OpenSCAD file
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadContent += `// ${part.target.name} (${part.symbol})\n`;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  surface(file = "${filename}", center = true, invert = true);\n\n`;
    });
    
    scadContent += `// Scale and extrude\n`;
    scadContent += `// Adjust the scale factor and height as needed\n`;
    
    zip.file('model.scad', scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

/**
 * Dynamically load JSZip library
 */
async function loadJSZip(): Promise<any> {
    if ((window as any).JSZip) {
        return (window as any).JSZip;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = () => {
            reject(new Error('Failed to load JSZip'));
        };
        document.head.appendChild(script);
    });
}

function toHex(value: number): string {
    return value.toString(16).padStart(2, '0');
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
