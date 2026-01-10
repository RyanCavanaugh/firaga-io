import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFContent(image);
    downloadFile(`${filename}.3mf`, xml, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

function build3MFContent(image: PartListImage): string {
    const meshes: string[] = [];
    const resources: string[] = [];
    let resourceId = 2;

    // Create a mesh for each color
    image.partList.forEach((part, partIndex) => {
        if (part.count === 0) return;

        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Build heightmap for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create a voxel (cube) for this pixel
                    addVoxel(vertices, triangles, x, y);
                }
            }
        }

        if (vertices.length === 0) return;

        const color = colorEntryToHex(part.target);
        const resourceIdStr = resourceId.toString();
        resourceId++;

        // Build mesh XML
        let meshXml = `    <object id="${resourceIdStr}" type="model">
      <mesh>
        <vertices>
`;
        vertices.forEach(([x, y, z]) => {
            meshXml += `          <vertex x="${x}" y="${y}" z="${z}" />
`;
        });
        meshXml += `        </vertices>
        <triangles>
`;
        triangles.forEach(([v1, v2, v3]) => {
            meshXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />
`;
        });
        meshXml += `        </triangles>
      </mesh>
    </object>
`;
        resources.push(meshXml);
        meshes.push(`      <item objectid="${resourceIdStr}" />`);
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('')}
  </resources>
  <build>
${meshes.join('\n')}
  </build>
</model>`;
}

function addVoxel(
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    x: number,
    y: number
): void {
    const baseIndex = vertices.length;
    const z = 0;
    const height = 1;

    // Add 8 vertices for the cube
    vertices.push(
        [x, y, z],           // 0: bottom-front-left
        [x + 1, y, z],       // 1: bottom-front-right
        [x + 1, y + 1, z],   // 2: bottom-back-right
        [x, y + 1, z],       // 3: bottom-back-left
        [x, y, z + height],       // 4: top-front-left
        [x + 1, y, z + height],   // 5: top-front-right
        [x + 1, y + 1, z + height], // 6: top-back-right
        [x, y + 1, z + height]    // 7: top-back-left
    );

    // Add 12 triangles (2 per face, 6 faces)
    // Bottom face (z = 0)
    triangles.push([baseIndex + 0, baseIndex + 2, baseIndex + 1]);
    triangles.push([baseIndex + 0, baseIndex + 3, baseIndex + 2]);

    // Top face (z = height)
    triangles.push([baseIndex + 4, baseIndex + 5, baseIndex + 6]);
    triangles.push([baseIndex + 4, baseIndex + 6, baseIndex + 7]);

    // Front face (y = 0)
    triangles.push([baseIndex + 0, baseIndex + 1, baseIndex + 5]);
    triangles.push([baseIndex + 0, baseIndex + 5, baseIndex + 4]);

    // Back face (y = 1)
    triangles.push([baseIndex + 3, baseIndex + 6, baseIndex + 2]);
    triangles.push([baseIndex + 3, baseIndex + 7, baseIndex + 6]);

    // Left face (x = 0)
    triangles.push([baseIndex + 0, baseIndex + 4, baseIndex + 7]);
    triangles.push([baseIndex + 0, baseIndex + 7, baseIndex + 3]);

    // Right face (x = 1)
    triangles.push([baseIndex + 1, baseIndex + 2, baseIndex + 6]);
    triangles.push([baseIndex + 1, baseIndex + 6, baseIndex + 5]);
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
