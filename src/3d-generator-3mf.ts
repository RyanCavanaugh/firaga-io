import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

/**
 * Generates a 3MF (3D Manufacturing Format) file from a PartListImage.
 * Creates a triangle mesh with separate material shapes for each color.
 */
export function generate3MF(image: PartListImage, settings: ThreeDSettings): Blob {
    const voxelSize = settings.voxelSize;
    const height = settings.height;

    // Build the 3MF XML structure
    const materials: string[] = [];
    const objects: string[] = [];

    // Create material definitions for each color
    image.partList.forEach((part, idx) => {
        const hexColor = colorEntryToHex(part.target).slice(1); // Remove '#'
        materials.push(`    <basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${hexColor}" />`);
    });

    // Create mesh objects for each color
    image.partList.forEach((part, materialIdx) => {
        const vertices: Array<readonly [number, number, number]> = [];
        const triangles: number[] = [];
        let vertexCount = 0;

        // Generate voxels for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    // Create a cube (voxel) at this position
                    const voxelVertices = createVoxel(
                        x * voxelSize,
                        y * voxelSize,
                        0,
                        voxelSize,
                        height
                    );
                    
                    const baseIdx = vertexCount;
                    vertices.push(...voxelVertices);
                    
                    // Add triangles (12 triangles for a cube, 2 per face)
                    const voxelTriangles = createVoxelTriangles(baseIdx);
                    triangles.push(...voxelTriangles);
                    
                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const verticesXml = vertices
                .map(v => `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`)
                .join('\n');
            
            const trianglesXml = [];
            for (let i = 0; i < triangles.length; i += 3) {
                trianglesXml.push(`      <triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" p1="${materialIdx}" />`);
            }

            objects.push(`  <object id="${materialIdx + 2}" type="model">
    <mesh>
      <vertices>
${verticesXml}
      </vertices>
      <triangles>
${trianglesXml.join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });

    // Build components that reference all objects
    const components = objects
        .map((_, idx) => `      <component objectid="${idx + 2}" />`)
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${objects.join('\n')}
    <object id="1" type="model">
      <components>
${components}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

export type ThreeDSettings = {
    readonly voxelSize: number;
    readonly height: number;
};

function createVoxel(
    x: number,
    y: number,
    z: number,
    size: number,
    height: number
): ReadonlyArray<readonly [number, number, number]> {
    // 8 vertices of a cube
    return [
        [x, y, z],
        [x + size, y, z],
        [x + size, y + size, z],
        [x, y + size, z],
        [x, y, z + height],
        [x + size, y, z + height],
        [x + size, y + size, z + height],
        [x, y + size, z + height],
    ] as const;
}

function createVoxelTriangles(baseIdx: number): number[] {
    // 12 triangles (2 per face, 6 faces)
    return [
        // Bottom face (z = 0)
        baseIdx + 0, baseIdx + 1, baseIdx + 2,
        baseIdx + 0, baseIdx + 2, baseIdx + 3,
        // Top face (z = height)
        baseIdx + 4, baseIdx + 6, baseIdx + 5,
        baseIdx + 4, baseIdx + 7, baseIdx + 6,
        // Front face (y = 0)
        baseIdx + 0, baseIdx + 5, baseIdx + 1,
        baseIdx + 0, baseIdx + 4, baseIdx + 5,
        // Back face (y = size)
        baseIdx + 2, baseIdx + 7, baseIdx + 3,
        baseIdx + 2, baseIdx + 6, baseIdx + 7,
        // Left face (x = 0)
        baseIdx + 0, baseIdx + 3, baseIdx + 7,
        baseIdx + 0, baseIdx + 7, baseIdx + 4,
        // Right face (x = size)
        baseIdx + 1, baseIdx + 6, baseIdx + 2,
        baseIdx + 1, baseIdx + 5, baseIdx + 6,
    ];
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
