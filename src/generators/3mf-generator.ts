import { PartListImage } from '../image-utils';

export type ThreeMFOptions = {
    filename: string;
    pixelWidth: number;
    pixelHeight: number;
    baseHeight: number;
};

export function generate3MF(image: PartListImage, options: ThreeMFOptions): Blob {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, baseHeight } = options;

    let meshXml = '';
    let objectId = 1;
    const buildItems: string[] = [];

    // Generate a mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const entry = partList[colorIdx];
        if (!entry || entry.count === 0) continue;

        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<{ v1: number; v2: number; v3: number }> = [];

        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;

                    // Bottom vertices
                    vertices.push({ x: x0, y: y0, z: 0 });
                    vertices.push({ x: x1, y: y0, z: 0 });
                    vertices.push({ x: x1, y: y1, z: 0 });
                    vertices.push({ x: x0, y: y1, z: 0 });

                    // Top vertices
                    vertices.push({ x: x0, y: y0, z: baseHeight });
                    vertices.push({ x: x1, y: y0, z: baseHeight });
                    vertices.push({ x: x1, y: y1, z: baseHeight });
                    vertices.push({ x: x0, y: y1, z: baseHeight });

                    // Bottom face
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 2, v3: baseIdx + 1 });
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 3, v3: baseIdx + 2 });

                    // Top face
                    triangles.push({ v1: baseIdx + 4, v2: baseIdx + 5, v3: baseIdx + 6 });
                    triangles.push({ v1: baseIdx + 4, v2: baseIdx + 6, v3: baseIdx + 7 });

                    // Front face
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 1, v3: baseIdx + 5 });
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 5, v3: baseIdx + 4 });

                    // Back face
                    triangles.push({ v1: baseIdx + 2, v2: baseIdx + 3, v3: baseIdx + 7 });
                    triangles.push({ v1: baseIdx + 2, v2: baseIdx + 7, v3: baseIdx + 6 });

                    // Left face
                    triangles.push({ v1: baseIdx + 3, v2: baseIdx + 0, v3: baseIdx + 4 });
                    triangles.push({ v1: baseIdx + 3, v2: baseIdx + 4, v3: baseIdx + 7 });

                    // Right face
                    triangles.push({ v1: baseIdx + 1, v2: baseIdx + 2, v3: baseIdx + 6 });
                    triangles.push({ v1: baseIdx + 1, v2: baseIdx + 6, v3: baseIdx + 5 });
                }
            }
        }

        if (vertices.length === 0) continue;

        // Build mesh XML
        let meshContent = '<mesh><vertices>';
        for (const v of vertices) {
            meshContent += `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`;
        }
        meshContent += '</vertices><triangles>';
        for (const t of triangles) {
            meshContent += `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`;
        }
        meshContent += '</triangles></mesh>';

        const r = entry.target.r;
        const g = entry.target.g;
        const b = entry.target.b;
        const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

        meshXml += `<object id="${objectId}" type="model">${meshContent}</object>`;
        buildItems.push(`<item objectid="${objectId}" partnumber="${entry.target.name}" />`);
        objectId++;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${meshXml}
  </resources>
  <build>
    ${buildItems.join('\n    ')}
  </build>
</model>`;

    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}
