import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage): string {
    const voxelHeight = 1.0;
    const voxelWidth = 1.0;
    const voxelDepth = 1.0;
    
    let vertexIndex = 0;
    const meshParts: string[] = [];
    const materials: string[] = [];
    
    // Build materials and meshes for each color
    image.partList.forEach((part, colorIndex) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove # prefix
        materials.push(`    <base name="${part.target.name}" displaycolor="#${color}" />`);
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexIndex = 0;
        
        // Create voxels for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const voxel = createVoxelMesh(x * voxelWidth, y * voxelHeight, voxelDepth, voxelWidth, voxelHeight, voxelDepth, localVertexIndex);
                    vertices.push(...voxel.vertices);
                    triangles.push(...voxel.triangles);
                    localVertexIndex += 8; // Each voxel has 8 vertices
                }
            }
        }
        
        if (vertices.length > 0) {
            meshParts.push(`    <object id="${colorIndex + 1}" type="model" pid="${colorIndex + 1}" pindex="0">
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
    
    const materialsXML = materials.length > 0 ? `  <basematerials id="1">
${materials.join('\n')}
  </basematerials>` : '';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
${materialsXML}
  <resources>
${meshParts.join('\n')}
    <object id="${image.partList.length + 1}" type="model">
      <components>
${image.partList.map((_, i) => `        <component objectid="${i + 1}" />`).join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${image.partList.length + 1}" />
  </build>
</model>`;
}

function createVoxelMesh(
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    startIndex: number
): { vertices: string[]; triangles: string[] } {
    // Define 8 vertices of a box
    const v = [
        [x, y, z],
        [x + width, y, z],
        [x + width, y + height, z],
        [x, y + height, z],
        [x, y, z + depth],
        [x + width, y, z + depth],
        [x + width, y + height, z + depth],
        [x, y + height, z + depth]
    ];
    
    const vertices = v.map(([vx, vy, vz]) => 
        `          <vertex x="${vx.toFixed(3)}" y="${vy.toFixed(3)}" z="${vz.toFixed(3)}" />`
    );
    
    // Define 12 triangles (2 per face, 6 faces)
    const faces = [
        [0, 1, 2], [0, 2, 3], // Front
        [1, 5, 6], [1, 6, 2], // Right
        [5, 4, 7], [5, 7, 6], // Back
        [4, 0, 3], [4, 3, 7], // Left
        [3, 2, 6], [3, 6, 7], // Top
        [4, 5, 1], [4, 1, 0]  // Bottom
    ];
    
    const triangles = faces.map(([a, b, c]) => 
        `          <triangle v1="${startIndex + a}" v2="${startIndex + b}" v3="${startIndex + c}" />`
    );
    
    return { vertices, triangles };
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
