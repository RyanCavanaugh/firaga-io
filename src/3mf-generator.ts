import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export function make3MF(image: PartListImage, filename: string): void {
    const xml = generate3MF(image, filename);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MF(image: PartListImage, filename: string): string {
    const width = image.width;
    const height = image.height;
    const depth = 1.0;
    const pixelSize = 1.0;

    let vertices = '';
    let triangles = '';
    let vertexIndex = 0;
    const materials: string[] = [];
    const objectXML: string[] = [];

    // Create material for each color
    image.partList.forEach((part, colorIndex) => {
        const { r, g, b } = part.target;
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        materials.push(`    <base:displaycolor name="${part.target.name}" value="${hexColor}" />`);
    });

    // Generate mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        let colorVertexIndex = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = depth;

                    // Create 8 vertices for the cube
                    const v0 = colorVertexIndex++;
                    const v1 = colorVertexIndex++;
                    const v2 = colorVertexIndex++;
                    const v3 = colorVertexIndex++;
                    const v4 = colorVertexIndex++;
                    const v5 = colorVertexIndex++;
                    const v6 = colorVertexIndex++;
                    const v7 = colorVertexIndex++;

                    colorVertices.push(
                        `      <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );

                    // Create 12 triangles (2 per face, 6 faces)
                    colorTriangles.push(
                        // Bottom face
                        `      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`,
                        `      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`,
                        // Top face
                        `      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`,
                        `      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`,
                        // Front face
                        `      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`,
                        `      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`,
                        // Back face
                        `      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`,
                        `      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`,
                        // Left face
                        `      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`,
                        `      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`,
                        // Right face
                        `      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`,
                        `      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`
                    );
                }
            }
        }

        if (colorVertices.length > 0) {
            objectXML.push(`  <object id="${colorIndex + 2}" name="${part.target.name}" type="model">
    <mesh>
      <vertices>
${colorVertices.join('\n')}
      </vertices>
      <triangles>
${colorTriangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });

    const componentItems = objectXML.map((_, idx) => 
        `      <component objectid="${idx + 2}" />`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${filename}</metadata>
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${objectXML.join('\n')}
    <object id="1" type="model">
      <components>
${componentItems}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}
