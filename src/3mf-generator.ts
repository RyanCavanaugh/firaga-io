import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { ThreeDSettings } from "./3d-types";

export function generate3MF(image: PartListImage, settings: ThreeDSettings): Blob {
    const { width, height, partList } = image;
    const { pixelSize, height: extrusionHeight } = settings;

    // 3MF XML structure
    const meshes: string[] = [];
    const materials: string[] = [];
    const objects: string[] = [];

    // Create a material and mesh for each color
    partList.forEach((entry, colorIndex) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove #
        const materialId = colorIndex + 1;
        
        // Add material definition
        materials.push(`    <base:material materialid="${materialId}" name="${entry.target.name}" displaycolor="#${color}FF" />`);

        // Collect vertices for this color
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
        let vertexIndex = 0;

        // Build mesh for each pixel of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = x0 + pixelSize;
                    const y1 = y0 + pixelSize;
                    const z0 = 0;
                    const z1 = extrusionHeight;

                    const baseIdx = vertexIndex;

                    // 8 vertices of the cube
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

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const verticesXml = vertices.map(v => `        <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
            const trianglesXml = triangles.map(t => `        <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');

            const meshXml = `      <mesh>
        <vertices>
${verticesXml}
        </vertices>
        <triangles>
${trianglesXml}
        </triangles>
      </mesh>`;

            meshes.push(meshXml);
            objects.push(`    <object id="${colorIndex + 2}" type="model" pid="${materialId}">\n${meshXml}\n    </object>`);
        }
    });

    const materialsXml = materials.length > 0 ? `  <basematerials id="1">\n${materials.join('\n')}\n  </basematerials>` : '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${materialsXml}
${objects.join('\n')}
  </resources>
  <build>
${partList.map((_, i) => `    <item objectid="${i + 2}" />`).join('\n')}
  </build>
</model>`;

    return new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
}

export function download3MF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".3mf") ? filename : `${filename}.3mf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
