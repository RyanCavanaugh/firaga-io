import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export function generate3MF(image: PartListImage, filename: string, heightPerLayer: number): void {
    const xml = build3MFXml(image, heightPerLayer);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, `${filename}.3mf`);
}

function build3MFXml(image: PartListImage, heightPerLayer: number): string {
    const layerHeight = heightPerLayer;
    const pixelSize = 1.0; // 1mm per pixel in X/Y
    
    // Build materials section
    const materialsXml = image.partList.map((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove '#'
        return `    <basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`;
    }).join('\n');
    
    // Build mesh for each color
    const meshes: string[] = [];
    const objects: string[] = [];
    
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // For each pixel of this color, create a box
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const boxVertices = createBox(
                        x * pixelSize,
                        y * pixelSize,
                        0,
                        pixelSize,
                        pixelSize,
                        layerHeight
                    );
                    
                    const baseIdx = vertexCount;
                    vertices.push(...boxVertices.vertices.map(v => 
                        `        <vertex x="${v.x.toFixed(6)}" y="${v.y.toFixed(6)}" z="${v.z.toFixed(6)}" />`
                    ));
                    
                    triangles.push(...boxVertices.triangles.map(t => 
                        `        <triangle v1="${baseIdx + t.v1}" v2="${baseIdx + t.v2}" v3="${baseIdx + t.v3}" pid="0" p1="${colorIdx}" />`
                    ));
                    
                    vertexCount += boxVertices.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = colorIdx + 1;
            meshes.push(`  <mesh>
${vertices.join('\n')}
${triangles.join('\n')}
  </mesh>`);
            
            objects.push(`  <object id="${meshId}" type="model">
    <mesh>
      ${vertices.join('\n      ')}
      ${triangles.join('\n      ')}
    </mesh>
  </object>`);
        }
    });
    
    // Build build section referencing all objects
    const buildItems = objects.map((_, idx) => 
        `    <item objectid="${idx + 1}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials:basematerials id="0">
${materialsXml}
    </basematerials:basematerials>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };

function createBox(
    x: number, 
    y: number, 
    z: number, 
    width: number, 
    depth: number, 
    height: number
): { vertices: Vertex[]; triangles: Triangle[] } {
    const vertices: Vertex[] = [
        // Bottom face (z = z)
        { x: x, y: y, z: z },
        { x: x + width, y: y, z: z },
        { x: x + width, y: y + depth, z: z },
        { x: x, y: y + depth, z: z },
        // Top face (z = z + height)
        { x: x, y: y, z: z + height },
        { x: x + width, y: y, z: z + height },
        { x: x + width, y: y + depth, z: z + height },
        { x: x, y: y + depth, z: z + height },
    ];
    
    const triangles: Triangle[] = [
        // Bottom face
        { v1: 0, v2: 2, v3: 1 },
        { v1: 0, v2: 3, v3: 2 },
        // Top face
        { v1: 4, v2: 5, v3: 6 },
        { v1: 4, v2: 6, v3: 7 },
        // Front face (y = y)
        { v1: 0, v2: 1, v3: 5 },
        { v1: 0, v2: 5, v3: 4 },
        // Back face (y = y + depth)
        { v1: 2, v2: 3, v3: 7 },
        { v1: 2, v2: 7, v3: 6 },
        // Left face (x = x)
        { v1: 0, v2: 4, v3: 7 },
        { v1: 0, v2: 7, v3: 3 },
        // Right face (x = x + width)
        { v1: 1, v2: 2, v3: 6 },
        { v1: 1, v2: 6, v3: 5 },
    ];
    
    return { vertices, triangles };
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
