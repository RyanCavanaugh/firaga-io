import { PartListImage } from "./image-utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    height: number; // Height in mm
    baseHeight: number; // Base height in mm
    pixelSize: number; // Size of each pixel in mm
}

export async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    const { width, height, partList, pixels } = image;
    const pixelSize = settings.pixelSize;
    const baseHeight = settings.baseHeight;
    const pixelHeight = settings.height;

    // Build 3MF XML structure
    let meshXml = '';
    let objectId = 1;
    const objects: string[] = [];

    // Create a mesh for each color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const color = partList[colorIndex].target;
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseHeight + pixelHeight;

                    // 8 vertices of the cube
                    const v = vertexIndex;
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}"/>`
                    );

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${v}" v2="${v+2}" v3="${v+1}"/>`);
                    triangles.push(`<triangle v1="${v}" v2="${v+3}" v3="${v+2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${v}" v2="${v+1}" v3="${v+5}"/>`);
                    triangles.push(`<triangle v1="${v}" v2="${v+5}" v3="${v+4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${v+3}" v2="${v}" v3="${v+4}"/>`);
                    triangles.push(`<triangle v1="${v+3}" v2="${v+4}" v3="${v+7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}"/>`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const colorHex = `#${((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1)}`;
            objects.push(`
    <object id="${objectId}" name="${color.name}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>
    <basematerials id="${objectId}00">
      <base name="${color.name}" displaycolor="${colorHex}" />
    </basematerials>`);
            objectId++;
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${objects.join('\n    ')}
  </resources>
  <build>
    ${objects.map((_, i) => `<item objectid="${i + 1}" />`).join('\n    ')}
  </build>
</model>`;

    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}
