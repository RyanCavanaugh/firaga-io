import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeMFSettings {
    layerHeight: number;
    filename: string;
}

export function generate3mf(image: PartListImage, settings: ThreeMFSettings): void {
    const xml = create3MFContent(image, settings.layerHeight);
    downloadFile(xml, `${settings.filename}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

function create3MFContent(image: PartListImage, layerHeight: number): string {
    const pixelWidth = 1.0; // 1mm per pixel
    const pixelHeight = 1.0;
    
    let objectsXml = '';
    let componentsXml = '';
    let baseMaterialsXml = '<basematerials id="1">\n';
    
    // Create materials and objects for each color
    image.partList.forEach((part, materialIndex) => {
        const colorHex = colorEntryToHex(part.target);
        const rgb = hexToRgb(colorHex);
        
        // Add material definition
        baseMaterialsXml += `  <base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />\n`;
        
        // Create mesh for this color
        const objectId = materialIndex + 2; // Start at 2 (1 is basematerials)
        const mesh = createMeshForColor(image, materialIndex, pixelWidth, pixelHeight, layerHeight);
        
        objectsXml += `  <object id="${objectId}" type="model" pid="1" pindex="${materialIndex}">\n`;
        objectsXml += `    <mesh>\n`;
        objectsXml += `      <vertices>\n`;
        mesh.vertices.forEach(v => {
            objectsXml += `        <vertex x="${v.x.toFixed(6)}" y="${v.y.toFixed(6)}" z="${v.z.toFixed(6)}" />\n`;
        });
        objectsXml += `      </vertices>\n`;
        objectsXml += `      <triangles>\n`;
        mesh.triangles.forEach(t => {
            objectsXml += `        <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
        });
        objectsXml += `      </triangles>\n`;
        objectsXml += `    </mesh>\n`;
        objectsXml += `  </object>\n`;
        
        // Add component reference
        componentsXml += `    <component objectid="${objectId}" />\n`;
    });
    
    baseMaterialsXml += '  </basematerials>\n';
    
    // Create root component that includes all color objects
    const buildObjectId = image.partList.length + 2;
    const componentObject = `  <object id="${buildObjectId}" type="model">\n` +
        `    <components>\n${componentsXml}    </components>\n` +
        `  </object>\n`;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${baseMaterialsXml}${objectsXml}${componentObject}  </resources>
  <build>
    <item objectid="${buildObjectId}" />
  </build>
</model>`;
    
    return xml;
}

interface Vertex {
    x: number;
    y: number;
    z: number;
}

interface Triangle {
    v1: number;
    v2: number;
    v3: number;
}

interface Mesh {
    vertices: Vertex[];
    triangles: Triangle[];
}

function createMeshForColor(
    image: PartListImage,
    colorIndex: number,
    pixelWidth: number,
    pixelHeight: number,
    layerHeight: number
): Mesh {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    
    // Create a box for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                const baseVertex = vertices.length;
                const x0 = x * pixelWidth;
                const x1 = (x + 1) * pixelWidth;
                const y0 = y * pixelHeight;
                const y1 = (y + 1) * pixelHeight;
                const z0 = 0;
                const z1 = layerHeight;
                
                // Add 8 vertices for the box
                vertices.push(
                    { x: x0, y: y0, z: z0 }, // 0
                    { x: x1, y: y0, z: z0 }, // 1
                    { x: x1, y: y1, z: z0 }, // 2
                    { x: x0, y: y1, z: z0 }, // 3
                    { x: x0, y: y0, z: z1 }, // 4
                    { x: x1, y: y0, z: z1 }, // 5
                    { x: x1, y: y1, z: z1 }, // 6
                    { x: x0, y: y1, z: z1 }  // 7
                );
                
                // Add 12 triangles for the 6 faces of the box
                // Bottom face
                triangles.push(
                    { v1: baseVertex + 0, v2: baseVertex + 1, v3: baseVertex + 2 },
                    { v1: baseVertex + 0, v2: baseVertex + 2, v3: baseVertex + 3 }
                );
                // Top face
                triangles.push(
                    { v1: baseVertex + 4, v2: baseVertex + 6, v3: baseVertex + 5 },
                    { v1: baseVertex + 4, v2: baseVertex + 7, v3: baseVertex + 6 }
                );
                // Front face
                triangles.push(
                    { v1: baseVertex + 0, v2: baseVertex + 4, v3: baseVertex + 5 },
                    { v1: baseVertex + 0, v2: baseVertex + 5, v3: baseVertex + 1 }
                );
                // Back face
                triangles.push(
                    { v1: baseVertex + 2, v2: baseVertex + 6, v3: baseVertex + 7 },
                    { v1: baseVertex + 2, v2: baseVertex + 7, v3: baseVertex + 3 }
                );
                // Left face
                triangles.push(
                    { v1: baseVertex + 0, v2: baseVertex + 3, v3: baseVertex + 7 },
                    { v1: baseVertex + 0, v2: baseVertex + 7, v3: baseVertex + 4 }
                );
                // Right face
                triangles.push(
                    { v1: baseVertex + 1, v2: baseVertex + 5, v3: baseVertex + 6 },
                    { v1: baseVertex + 1, v2: baseVertex + 6, v3: baseVertex + 2 }
                );
            }
        }
    }
    
    return { vertices, triangles };
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#FF0000FF';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `#${result[1]}${result[2]}${result[3]}FF`;
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
