import { PartListImage } from "../image-utils";
import { colorEntryToHex } from "../utils";

export function generate3MF(image: PartListImage, filename: string) {
    const content = create3MFContent(image);
    downloadFile(content, `${filename}.3mf`, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function create3MFContent(image: PartListImage): string {
    // Build the 3D model with each color as a separate mesh
    const meshes: string[] = [];
    const resources: string[] = [];
    
    let meshId = 1;
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const baseVertexIdx = vertices.length;
                    
                    // Define the 8 vertices of the cube
                    // Bottom face (z=0)
                    vertices.push([x, y, 0]);
                    vertices.push([x + 1, y, 0]);
                    vertices.push([x + 1, y + 1, 0]);
                    vertices.push([x, y + 1, 0]);
                    // Top face (z=1)
                    vertices.push([x, y, 1]);
                    vertices.push([x + 1, y, 1]);
                    vertices.push([x + 1, y + 1, 1]);
                    vertices.push([x, y + 1, 1]);
                    
                    // Define the 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseVertexIdx + 0, baseVertexIdx + 2, baseVertexIdx + 1]);
                    triangles.push([baseVertexIdx + 0, baseVertexIdx + 3, baseVertexIdx + 2]);
                    // Top face
                    triangles.push([baseVertexIdx + 4, baseVertexIdx + 5, baseVertexIdx + 6]);
                    triangles.push([baseVertexIdx + 4, baseVertexIdx + 6, baseVertexIdx + 7]);
                    // Front face
                    triangles.push([baseVertexIdx + 0, baseVertexIdx + 1, baseVertexIdx + 5]);
                    triangles.push([baseVertexIdx + 0, baseVertexIdx + 5, baseVertexIdx + 4]);
                    // Back face
                    triangles.push([baseVertexIdx + 2, baseVertexIdx + 3, baseVertexIdx + 7]);
                    triangles.push([baseVertexIdx + 2, baseVertexIdx + 7, baseVertexIdx + 6]);
                    // Left face
                    triangles.push([baseVertexIdx + 3, baseVertexIdx + 0, baseVertexIdx + 4]);
                    triangles.push([baseVertexIdx + 3, baseVertexIdx + 4, baseVertexIdx + 7]);
                    // Right face
                    triangles.push([baseVertexIdx + 1, baseVertexIdx + 2, baseVertexIdx + 6]);
                    triangles.push([baseVertexIdx + 1, baseVertexIdx + 6, baseVertexIdx + 5]);
                }
            }
        }
        
        // Only create mesh if this color has pixels
        if (vertices.length > 0) {
            const vertexString = vertices.map(v => `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`).join('\n        ');
            const triangleString = triangles.map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`).join('\n        ');
            
            const hex = colorEntryToHex(color.target);
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            
            // Add base material
            resources.push(`  <basematerials id="${meshId + 1000}">
    <base name="${color.target.name}" displaycolor="#${hex.substring(1)}" />
  </basematerials>`);
            
            // Add mesh
            meshes.push(`  <object id="${meshId}" type="model" pid="${meshId + 1000}" pindex="0">
    <mesh>
      <vertices>
        ${vertexString}
      </vertices>
      <triangles>
        ${triangleString}
      </triangles>
    </mesh>
  </object>`);
            
            meshId++;
        }
    }
    
    // Build the complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
${meshes.join('\n')}
    <build>
${meshes.map((_, idx) => `      <item objectid="${idx + 1}" />`).join('\n')}
    </build>
  </resources>
</model>`;
    
    return xml;
}

function downloadFile(content: string, filename: string, mimeType: string) {
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
