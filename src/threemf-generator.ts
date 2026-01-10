import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type ThreeMFSettings = {
    heightPerLayer: number;
    baseHeight: number;
    pixelSize: number;
};

export function generate3MF(image: PartListImage, settings: ThreeMFSettings, filename: string) {
    const xml = build3MFContent(image, settings, filename);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeMFSettings, filename: string): string {
    const { heightPerLayer, baseHeight, pixelSize } = settings;
    
    // Build materials section
    const materials = image.partList.map((part, idx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(6);
        const g = (color.g / 255).toFixed(6);
        const b = (color.b / 255).toFixed(6);
        return `    <m:color color="#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}" />`;
    }).join('\n');

    // Build mesh objects for each color
    let objectId = 1;
    const objects: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertexCount;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseHeight + heightPerLayer;

                    // 8 vertices of the cube
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face
                    triangles.push(`        <triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face
                    triangles.push(`        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const objectContent = `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
            objects.push(objectContent);
            objectId++;
        }
    }

    // Build the complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(filename)}</metadata>
  <metadata name="Application">firaga.io</metadata>
  
  <resources>
    <m:colorgroup id="1">
${materials}
    </m:colorgroup>
    
${objects.join('\n')}
    
    <object id="${objectId}" type="model">
      <components>
${objects.map((_, idx) => `        <component objectid="${idx + 1}" />`).join('\n')}
      </components>
    </object>
  </resources>
  
  <build>
    <item objectid="${objectId}" />
  </build>
</model>`;

    return xml;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
