import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

/**
 * Generates a 3MF (3D Manufacturing Format) file from a PartListImage
 * Creates separate material shapes for each color in the image
 */
export function generate3MF(image: PartListImage, filename: string) {
    const meshes: string[] = [];
    const materials: string[] = [];
    
    // Create a mesh for each color
    image.partList.forEach((part, colorIndex) => {
        if (part.count === 0) return;
        
        // Get color in hex format
        const colorHex = colorEntryToHex(part.target).substring(1); // Remove #
        
        // Add material definition
        materials.push(`    <basematerials id="${colorIndex + 1}">
      <base name="${part.target.name}" displaycolor="#${colorHex}" />
    </basematerials>`);
        
        // Build mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a 1x1x1 cube at position (x, y, 0)
                    const cubeData = createCube(x, y, 0, 1, 1, 1, vertexIndex);
                    vertices.push(...cubeData.vertices);
                    triangles.push(...cubeData.triangles);
                    vertexIndex += 8; // A cube has 8 vertices
                }
            }
        }
        
        if (vertices.length > 0) {
            meshes.push(`    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>`);
        }
    });
    
    // Build the complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${meshes.map((mesh, idx) => `    <object id="${idx + 100}" type="model">
${mesh}
    </object>`).join('\n')}
  </resources>
  <build>
${meshes.map((mesh, idx) => `    <item objectid="${idx + 100}" />`).join('\n')}
  </build>
</model>`;
    
    // Create and download the file
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadBlob(blob, `${filename}.3mf`);
}

/**
 * Creates vertices and triangles for a cube
 */
function createCube(x: number, y: number, z: number, w: number, h: number, d: number, startIdx: number) {
    const vertices: string[] = [];
    const triangles: string[] = [];
    
    // Define 8 vertices of the cube
    const v = [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + h, z],
        [x, y + h, z],
        [x, y, z + d],
        [x + w, y, z + d],
        [x + w, y + h, z + d],
        [x, y + h, z + d]
    ];
    
    // Add vertices
    v.forEach(([vx, vy, vz]) => {
        vertices.push(`        <vertex x="${vx}" y="${vy}" z="${vz}" />`);
    });
    
    // Define 12 triangles (2 per face, 6 faces)
    const faces = [
        [0, 1, 2], [0, 2, 3], // Front
        [4, 6, 5], [4, 7, 6], // Back
        [0, 4, 5], [0, 5, 1], // Bottom
        [3, 2, 6], [3, 6, 7], // Top
        [0, 3, 7], [0, 7, 4], // Left
        [1, 5, 6], [1, 6, 2]  // Right
    ];
    
    faces.forEach(([v1, v2, v3]) => {
        triangles.push(`        <triangle v1="${startIdx + v1}" v2="${startIdx + v2}" v3="${startIdx + v3}" />`);
    });
    
    return { vertices, triangles };
}

/**
 * Downloads a blob as a file
 */
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
