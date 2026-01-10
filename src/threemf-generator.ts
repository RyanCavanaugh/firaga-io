import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';
import * as FileSaver from 'file-saver';

export type ThreeMFSettings = {
    filename: string;
    layerHeight: number;
    pixelSize: number;
};

export function generateThreeMF(image: PartListImage, settings: ThreeMFSettings) {
    const { filename, layerHeight, pixelSize } = settings;
    
    // Generate 3MF content
    const content = build3MF(image, layerHeight, pixelSize);
    
    // Create blob and download
    const blob = new Blob([content], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    FileSaver.saveAs(blob, `${filename}.3mf`);
}

function build3MF(image: PartListImage, layerHeight: number, pixelSize: number): string {
    const xmlns = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';
    const xmlnsMaterials = 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="${xmlns}" xmlns:m="${xmlnsMaterials}">
  <resources>
    <m:colorgroup id="1">
`;

    // Add color definitions
    image.partList.forEach((part, index) => {
        const hex = colorEntryToHex(part.target);
        const color = hex.substring(1); // Remove # prefix
        xml += `      <m:color color="#${color}FF" />\n`;
    });

    xml += `    </m:colorgroup>
`;

    // Generate meshes for each color layer
    let meshId = 2;
    const objectIds: number[] = [];

    image.partList.forEach((part, colorIndex) => {
        const vertices: { x: number, y: number, z: number }[] = [];
        const triangles: number[][] = [];
        let vertexIndex = 0;

        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = layerHeight;

                    // Add 8 vertices for the cube
                    const baseIdx = vertexIndex;
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

                    // Add 12 triangles (2 per face, 6 faces)
                    triangles.push(
                        [baseIdx + 0, baseIdx + 1, baseIdx + 2], [baseIdx + 0, baseIdx + 2, baseIdx + 3], // Bottom
                        [baseIdx + 4, baseIdx + 6, baseIdx + 5], [baseIdx + 4, baseIdx + 7, baseIdx + 6], // Top
                        [baseIdx + 0, baseIdx + 4, baseIdx + 5], [baseIdx + 0, baseIdx + 5, baseIdx + 1], // Front
                        [baseIdx + 1, baseIdx + 5, baseIdx + 6], [baseIdx + 1, baseIdx + 6, baseIdx + 2], // Right
                        [baseIdx + 2, baseIdx + 6, baseIdx + 7], [baseIdx + 2, baseIdx + 7, baseIdx + 3], // Back
                        [baseIdx + 3, baseIdx + 7, baseIdx + 4], [baseIdx + 3, baseIdx + 4, baseIdx + 0]  // Left
                    );

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${meshId}" type="model" pid="1" pindex="${colorIndex}">
      <mesh>
        <vertices>
`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}" />\n`;
            });

            xml += `        </vertices>
        <triangles>
`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />\n`;
            });

            xml += `        </triangles>
      </mesh>
    </object>
`;
            objectIds.push(meshId);
            meshId++;
        }
    });

    // Create build section
    xml += `  </resources>
  <build>
`;
    objectIds.forEach(id => {
        xml += `    <item objectid="${id}" />\n`;
    });
    xml += `  </build>
</model>`;

    return xml;
}
