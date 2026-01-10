import { PartListImage } from "./image-utils";
import { saveAs } from 'file-saver';

/**
 * Generates a 3MF file (3D Manufacturing Format) with triangle meshes for each color
 */
export function generate3MF(image: PartListImage, filename: string) {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage): string {
    const voxelHeight = 1.0; // Height of each voxel in mm
    const voxelWidth = 1.0;  // Width of each voxel in mm
    const voxelDepth = 1.0;  // Depth of each voxel in mm

    let vertices: string[] = [];
    let triangles: string[] = [];
    let vertexIndex = 0;
    let objectId = 1;
    let objects: string[] = [];
    let components: string[] = [];

    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        vertices = [];
        triangles = [];
        vertexIndex = 0;

        // Build voxels for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Add a cube at this position
                    const x0 = x * voxelWidth;
                    const y0 = y * voxelDepth;
                    const z0 = 0;
                    const x1 = x0 + voxelWidth;
                    const y1 = y0 + voxelDepth;
                    const z1 = z0 + voxelHeight;

                    const startIdx = vertexIndex;

                    // 8 vertices of the cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 1}" v3="${startIdx + 2}"/>`);
                    triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 2}" v3="${startIdx + 3}"/>`);
                    // Top face (z=z1)
                    triangles.push(`<triangle v1="${startIdx + 4}" v2="${startIdx + 6}" v3="${startIdx + 5}"/>`);
                    triangles.push(`<triangle v1="${startIdx + 4}" v2="${startIdx + 7}" v3="${startIdx + 6}"/>`);
                    // Front face (y=y0)
                    triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 5}" v3="${startIdx + 1}"/>`);
                    triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 4}" v3="${startIdx + 5}"/>`);
                    // Back face (y=y1)
                    triangles.push(`<triangle v1="${startIdx + 2}" v2="${startIdx + 7}" v3="${startIdx + 3}"/>`);
                    triangles.push(`<triangle v1="${startIdx + 2}" v2="${startIdx + 6}" v3="${startIdx + 7}"/>`);
                    // Left face (x=x0)
                    triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 3}" v3="${startIdx + 7}"/>`);
                    triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 7}" v3="${startIdx + 4}"/>`);
                    // Right face (x=x1)
                    triangles.push(`<triangle v1="${startIdx + 1}" v2="${startIdx + 6}" v3="${startIdx + 2}"/>`);
                    triangles.push(`<triangle v1="${startIdx + 1}" v2="${startIdx + 5}" v3="${startIdx + 6}"/>`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
            objects.push(`
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);

            // Add component with color
            components.push(`<component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>`);
            objectId++;
        }
    }

    // Build the final 3MF XML structure
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
    <object id="${objectId}" type="model">
      <components>
${components.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
  </build>
</model>`;

    return xml;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
