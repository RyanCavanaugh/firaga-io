import { PartListImage } from './image-utils';

export type Export3MFSettings = {
    filename: string;
    height: number; // Height of each pixel in mm
};

/**
 * Exports a PartListImage as a 3MF file with separate material shapes for each color
 */
export function export3MF(image: PartListImage, settings: Export3MFSettings) {
    const { filename, height } = settings;
    
    // Generate 3MF XML content
    const xml = generate3MFContent(image, height);
    
    // Create blob and download
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadBlob(blob, `${filename}.3mf`);
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

function generate3MFContent(image: PartListImage, pixelHeight: number): string {
    const pixelSize = 1.0; // 1mm per pixel width/depth
    const meshes: string[] = [];
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color in the part list
    image.partList.forEach((part, index) => {
        const color = part.target;
        const colorHex = rgbToHex(color.r, color.g, color.b);
        materials.push(`    <base name="${escapeXml(color.name)}" displaycolor="${colorHex}" />`);
    });
    
    // Create mesh for each color
    image.partList.forEach((part, materialIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIndex) {
                    // Create a box for this pixel
                    const box = createBox(x * pixelSize, y * pixelSize, 0, pixelSize, pixelSize, pixelHeight);
                    
                    // Add vertices
                    box.vertices.forEach(v => {
                        vertices.push(`      <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`);
                    });
                    
                    // Add triangles (with offset for current vertex index)
                    box.triangles.forEach(t => {
                        triangles.push(`      <triangle v1="${t.v1 + vertexIndex}" v2="${t.v2 + vertexIndex}" v3="${t.v3 + vertexIndex}" />`);
                    });
                    
                    vertexIndex += box.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = materialIndex + 1;
            meshes.push(`  <object id="${meshId}" type="model" pid="1" pindex="${materialIndex}">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });
    
    // Build complete 3MF structure
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${meshes.join('\n')}
  </resources>
  <build>
${meshes.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;
}

type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };

function createBox(x: number, y: number, z: number, width: number, depth: number, height: number): { vertices: Vertex[], triangles: Triangle[] } {
    // Define 8 vertices of the box
    const vertices: Vertex[] = [
        { x, y, z },                           // 0: bottom front-left
        { x: x + width, y, z },                // 1: bottom front-right
        { x: x + width, y: y + depth, z },     // 2: bottom back-right
        { x, y: y + depth, z },                // 3: bottom back-left
        { x, y, z: z + height },               // 4: top front-left
        { x: x + width, y, z: z + height },    // 5: top front-right
        { x: x + width, y: y + depth, z: z + height }, // 6: top back-right
        { x, y: y + depth, z: z + height }     // 7: top back-left
    ];
    
    // Define 12 triangles (2 per face, 6 faces)
    const triangles: Triangle[] = [
        // Bottom face (z = 0)
        { v1: 0, v2: 2, v3: 1 },
        { v1: 0, v2: 3, v3: 2 },
        // Top face (z = height)
        { v1: 4, v2: 5, v3: 6 },
        { v1: 4, v2: 6, v3: 7 },
        // Front face (y = 0)
        { v1: 0, v2: 1, v3: 5 },
        { v1: 0, v2: 5, v3: 4 },
        // Back face (y = depth)
        { v1: 3, v2: 7, v3: 6 },
        { v1: 3, v2: 6, v3: 2 },
        // Left face (x = 0)
        { v1: 0, v2: 4, v3: 7 },
        { v1: 0, v2: 7, v3: 3 },
        // Right face (x = width)
        { v1: 1, v2: 2, v3: 6 },
        { v1: 1, v2: 6, v3: 5 }
    ];
    
    return { vertices, triangles };
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

function escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
}
