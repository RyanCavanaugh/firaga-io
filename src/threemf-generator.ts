import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";

export type ThreeMFSettings = {
    pixelThickness: number; // Z-height of each pixel in mm
    pixelSize: number; // XY size of each pixel in mm
};

/**
 * Generates a 3MF file containing a triangle mesh with separate material shapes for each color.
 * 3MF files are ZIP archives containing XML model files and metadata.
 */
export async function generateThreeMF(image: PartListImage, settings: ThreeMFSettings): Promise<Blob> {
    const { width, height, pixels, partList } = image;
    const { pixelThickness, pixelSize } = settings;

    let modelXML = '';
    let resourceIndex = 1;

    // Generate a mesh for each color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const entry = partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Build vertices and triangles for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] !== colorIndex) continue;

                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = 0;
                const z1 = pixelThickness;

                const baseVertex = vertexIndex;

                // 8 vertices for a cube
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

                // 12 triangles (2 per face × 6 faces)
                const faces = [
                    [0, 1, 2], [0, 2, 3], // bottom
                    [4, 6, 5], [4, 7, 6], // top
                    [0, 4, 5], [0, 5, 1], // front
                    [1, 5, 6], [1, 6, 2], // right
                    [2, 6, 7], [2, 7, 3], // back
                    [3, 7, 4], [3, 4, 0], // left
                ];

                for (const [a, b, c] of faces) {
                    triangles.push(`<triangle v1="${baseVertex + a}" v2="${baseVertex + b}" v3="${baseVertex + c}"/>`);
                }

                vertexIndex += 8;
            }
        }

        if (vertices.length === 0) continue;

        const colorHex = colorEntryToHex(entry.target).substring(1); // Remove # prefix
        const color = `#${colorHex}`;

        modelXML += `
    <object id="${resourceIndex}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>
    <basematerials id="${resourceIndex + 1}">
      <base name="${entry.target.name}" displaycolor="${color}" />
    </basematerials>`;

        resourceIndex += 2;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${modelXML}
  </resources>
  <build>
${partList.map((_, idx) => {
    const objId = idx * 2 + 1;
    return `    <item objectid="${objId}" />`;
}).join('\n')}
  </build>
</model>`;

    // 3MF files are ZIP archives
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file("3D/3dmodel.model", xml);
    
    // Add [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Add _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.file("_rels/.rels", rels);

    return await zip.generateAsync({ type: 'blob' });
}
