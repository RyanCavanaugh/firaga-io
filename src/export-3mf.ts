import { PartListImage } from "./image-utils";

export interface Export3MFSettings {
    pixelSize: number;
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export function export3MF(image: PartListImage, settings: Export3MFSettings): void {
    const xml = generate3MFContent(image, settings);
    downloadFile(`${settings.filename}.3mf`, xml, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function generate3MFContent(image: PartListImage, settings: Export3MFSettings): string {
    const { pixelSize, pixelHeight, baseHeight } = settings;
    
    // Build XML for 3MF format
    let objectsXml = '';
    let resourcesXml = '';
    let buildItemsXml = '';
    
    // Create materials for each color
    let materialId = 1;
    const colorToMaterialId = new Map<number, number>();
    
    for (let i = 0; i < image.partList.length; i++) {
        const entry = image.partList[i];
        const color = entry.target;
        colorToMaterialId.set(i, materialId);
        
        // Convert RGB to hex color
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        const hexColor = `#${r}${g}${b}`;
        
        resourcesXml += `    <basematerials id="${materialId}">
      <base name="${escapeXml(color.name)}" displaycolor="${hexColor}" />
    </basematerials>\n`;
        materialId++;
    }
    
    // Generate mesh objects for each color
    let objectId = 1;
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const mesh = generateMeshForColor(image, colorIdx, settings);
        if (mesh.vertices.length === 0) continue;
        
        const matId = colorToMaterialId.get(colorIdx)!;
        
        objectsXml += `    <object id="${objectId}" type="model" pid="${matId}" pindex="0">\n`;
        objectsXml += `      <mesh>\n`;
        objectsXml += `        <vertices>\n`;
        
        for (const v of mesh.vertices) {
            objectsXml += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
        }
        
        objectsXml += `        </vertices>\n`;
        objectsXml += `        <triangles>\n`;
        
        for (const t of mesh.triangles) {
            objectsXml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
        }
        
        objectsXml += `        </triangles>\n`;
        objectsXml += `      </mesh>\n`;
        objectsXml += `    </object>\n`;
        
        buildItemsXml += `    <item objectid="${objectId}" />\n`;
        objectId++;
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${resourcesXml}${objectsXml}  </resources>
  <build>
${buildItemsXml}  </build>
</model>`;
}

type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };
type Mesh = { vertices: Vertex[]; triangles: Triangle[] };

function generateMeshForColor(
    image: PartListImage,
    colorIdx: number,
    settings: Export3MFSettings
): Mesh {
    const { pixelSize, pixelHeight, baseHeight } = settings;
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    
    // For each pixel of this color, generate a box
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                const baseIdx = vertices.length;
                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = baseHeight;
                const z1 = baseHeight + pixelHeight;
                
                // 8 vertices of a box
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
                
                // 12 triangles (2 per face, 6 faces)
                // Bottom face (z0)
                triangles.push(
                    { v1: baseIdx + 0, v2: baseIdx + 1, v3: baseIdx + 2 },
                    { v1: baseIdx + 0, v2: baseIdx + 2, v3: baseIdx + 3 }
                );
                // Top face (z1)
                triangles.push(
                    { v1: baseIdx + 4, v2: baseIdx + 6, v3: baseIdx + 5 },
                    { v1: baseIdx + 4, v2: baseIdx + 7, v3: baseIdx + 6 }
                );
                // Front face (y0)
                triangles.push(
                    { v1: baseIdx + 0, v2: baseIdx + 5, v3: baseIdx + 1 },
                    { v1: baseIdx + 0, v2: baseIdx + 4, v3: baseIdx + 5 }
                );
                // Back face (y1)
                triangles.push(
                    { v1: baseIdx + 2, v2: baseIdx + 7, v3: baseIdx + 3 },
                    { v1: baseIdx + 2, v2: baseIdx + 6, v3: baseIdx + 7 }
                );
                // Left face (x0)
                triangles.push(
                    { v1: baseIdx + 0, v2: baseIdx + 3, v3: baseIdx + 7 },
                    { v1: baseIdx + 0, v2: baseIdx + 7, v3: baseIdx + 4 }
                );
                // Right face (x1)
                triangles.push(
                    { v1: baseIdx + 1, v2: baseIdx + 6, v3: baseIdx + 2 },
                    { v1: baseIdx + 1, v2: baseIdx + 5, v3: baseIdx + 6 }
                );
            }
        }
    }
    
    return { vertices, triangles };
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(filename: string, content: string, mimeType: string): void {
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
