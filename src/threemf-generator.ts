import { PartListImage } from "./image-utils";

export interface ThreeMFSettings {
    pitch: number;
    height: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeMFSettings): Blob {
    const xml = generate3MFContent(image, settings);
    return new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
}

function generate3MFContent(image: PartListImage, settings: ThreeMFSettings): string {
    const { pitch, height } = settings;
    const colorToId = new Map<string, number>();
    const materials: string[] = [];
    
    // Build material definitions
    image.partList.forEach((part, idx) => {
        const colorKey = `${part.target.r},${part.target.g},${part.target.b}`;
        if (!colorToId.has(colorKey)) {
            colorToId.set(colorKey, materials.length);
            materials.push(
                `    <basematerials:displaycolor color="#${rgbToHex(part.target.r, part.target.g, part.target.b)}" name="${escapeXml(part.target.name)}" />`
            );
        }
    });

    let meshes = "";
    let objectId = 1;
    const components: string[] = [];

    // Generate one mesh per color
    image.partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Generate geometry for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const baseIdx = vertexCount;
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;

                    // 8 vertices for a box
                    vertices.push(
                        `      <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );

                    // 12 triangles (2 per face, 6 faces)
                    const colorKey = `${part.target.r},${part.target.g},${part.target.b}`;
                    const matId = colorToId.get(colorKey)!;
                    triangles.push(
                        // Bottom
                        `      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" pid="1" p1="${matId}" />`,
                        `      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" pid="1" p1="${matId}" />`,
                        // Top
                        `      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" pid="1" p1="${matId}" />`,
                        `      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" pid="1" p1="${matId}" />`,
                        // Front
                        `      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" pid="1" p1="${matId}" />`,
                        `      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" pid="1" p1="${matId}" />`,
                        // Back
                        `      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" pid="1" p1="${matId}" />`,
                        `      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" pid="1" p1="${matId}" />`,
                        // Left
                        `      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" pid="1" p1="${matId}" />`,
                        `      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" pid="1" p1="${matId}" />`,
                        // Right
                        `      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" pid="1" p1="${matId}" />`,
                        `      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" pid="1" p1="${matId}" />`
                    );

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            meshes += `  <object id="${objectId}" type="model">
    <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
    </mesh>
  </object>
`;
            components.push(`    <component objectid="${objectId}" />`);
            objectId++;
        }
    });

    // Build component that combines all color meshes
    const buildObjectId = objectId;
    const buildObject = `  <object id="${buildObjectId}" type="model">
    <components>
${components.join('\n')}
    </components>
  </object>
`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(settings.filename)}</metadata>
  <resources>
  <basematerials:basematerials id="1">
${materials.join('\n')}
  </basematerials:basematerials>
${meshes}${buildObject}  </resources>
  <build>
    <item objectid="${buildObjectId}" />
  </build>
</model>`;
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function download3MF(image: PartListImage, settings: ThreeMFSettings): Promise<void> {
    const blob = generate3MF(image, settings);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.filename}.3mf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
