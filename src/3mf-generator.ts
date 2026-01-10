import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface Generate3MFSettings {
    filename: string;
    pixelHeight: number;
    baseHeight: number;
}

export function generate3MF(image: PartListImage, settings: Generate3MFSettings): void {
    const xml = create3MFDocument(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function create3MFDocument(image: PartListImage, settings: Generate3MFSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    let meshId = 1;
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Generate material definitions for each color
    partList.forEach((part, index) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove # prefix
        materials.push(
            `    <basematerials:basematerial name="${escapeXml(color.name)}" displaycolor="#${hex}" />`
        );
    });
    
    // Generate mesh objects for each color
    partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Build mesh for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices for the box
                    const v0 = vertexIndex++;
                    const v1 = vertexIndex++;
                    const v2 = vertexIndex++;
                    const v3 = vertexIndex++;
                    const v4 = vertexIndex++;
                    const v5 = vertexIndex++;
                    const v6 = vertexIndex++;
                    const v7 = vertexIndex++;
                    
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
                    // Bottom face (z0)
                    triangles.push(
                        `      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`,
                        `      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`
                    );
                    // Top face (z1)
                    triangles.push(
                        `      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`,
                        `      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`
                    );
                    // Front face (y0)
                    triangles.push(
                        `      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`,
                        `      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`
                    );
                    // Back face (y1)
                    triangles.push(
                        `      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`,
                        `      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`
                    );
                    // Left face (x0)
                    triangles.push(
                        `      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`,
                        `      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`
                    );
                    // Right face (x1)
                    triangles.push(
                        `      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`,
                        `      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`
                    );
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(
                `    <object id="${meshId}" type="model" pid="1" pindex="${colorIndex}">`,
                `      <mesh>`,
                `        <vertices>`,
                ...vertices,
                `        </vertices>`,
                `        <triangles>`,
                ...triangles,
                `        </triangles>`,
                `      </mesh>`,
                `    </object>`
            );
            meshId++;
        }
    });
    
    const xml = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">`,
        `  <resources>`,
        `    <basematerials:basematerialgroup id="1">`,
        ...materials,
        `    </basematerials:basematerialgroup>`,
        ...objects,
        `  </resources>`,
        `  <build>`,
        ...Array.from({ length: meshId - 1 }, (_, i) => `    <item objectid="${i + 1}" />`),
        `  </build>`,
        `</model>`
    ].join('\n');
    
    return xml;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
