import { PartListImage } from "./image-utils";
import { ThreeDProps } from "./types";

export interface ThreeDSettings {
    format: ThreeDProps["format"];
    layerHeight: number;
    filename: string;
}

export async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const xml = build3MFModel(image, settings.layerHeight);
    
    // Create zip file with 3MF structure
    const blob = await create3MFZip(xml, image);
    
    // Download the file
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function build3MFModel(image: PartListImage, layerHeight: number): string {
    const pixelSize = 1.0; // 1mm per pixel
    const meshes: string[] = [];
    
    // Build a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // For each pixel of this color, create a rectangular prism
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = layerHeight;
                    
                    // 8 vertices of the rectangular prism
                    const baseIndex = vertexIndex;
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    
                    // 12 triangles (2 per face × 6 faces)
                    // Bottom face
                    triangles.push(
                        `<triangle v1="${baseIndex + 0}" v2="${baseIndex + 1}" v3="${baseIndex + 2}" />`,
                        `<triangle v1="${baseIndex + 0}" v2="${baseIndex + 2}" v3="${baseIndex + 3}" />`
                    );
                    // Top face
                    triangles.push(
                        `<triangle v1="${baseIndex + 4}" v2="${baseIndex + 6}" v3="${baseIndex + 5}" />`,
                        `<triangle v1="${baseIndex + 4}" v2="${baseIndex + 7}" v3="${baseIndex + 6}" />`
                    );
                    // Front face
                    triangles.push(
                        `<triangle v1="${baseIndex + 0}" v2="${baseIndex + 4}" v3="${baseIndex + 5}" />`,
                        `<triangle v1="${baseIndex + 0}" v2="${baseIndex + 5}" v3="${baseIndex + 1}" />`
                    );
                    // Back face
                    triangles.push(
                        `<triangle v1="${baseIndex + 2}" v2="${baseIndex + 6}" v3="${baseIndex + 7}" />`,
                        `<triangle v1="${baseIndex + 2}" v2="${baseIndex + 7}" v3="${baseIndex + 3}" />`
                    );
                    // Left face
                    triangles.push(
                        `<triangle v1="${baseIndex + 0}" v2="${baseIndex + 3}" v3="${baseIndex + 7}" />`,
                        `<triangle v1="${baseIndex + 0}" v2="${baseIndex + 7}" v3="${baseIndex + 4}" />`
                    );
                    // Right face
                    triangles.push(
                        `<triangle v1="${baseIndex + 1}" v2="${baseIndex + 5}" v3="${baseIndex + 6}" />`,
                        `<triangle v1="${baseIndex + 1}" v2="${baseIndex + 6}" v3="${baseIndex + 2}" />`
                    );
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
            meshes.push(`
                <object id="${colorIndex + 2}" type="model">
                    <mesh>
                        <vertices>
                            ${vertices.join('\n                            ')}
                        </vertices>
                        <triangles>
                            ${triangles.join('\n                            ')}
                        </triangles>
                    </mesh>
                </object>
                <item objectid="${colorIndex + 2}" transform="1 0 0 0 1 0 0 0 1 0 0 0" />
            `);
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        ${meshes.join('\n        ')}
    </resources>
    <build>
        ${image.partList.map((_, i) => `<item objectid="${i + 2}" />`).join('\n        ')}
    </build>
</model>`;
}

async function create3MFZip(modelXml: string, image: PartListImage): Promise<Blob> {
    // Use JSZip if available, otherwise create a simple zip
    if (typeof (window as any).JSZip !== 'undefined') {
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        zip.file('3D/3dmodel.model', modelXml);
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0"/>
</Relationships>`);
        
        return await zip.generateAsync({ type: 'blob' });
    } else {
        // Fallback: just return the model XML as a blob
        return new Blob([modelXml], { type: 'application/xml' });
    }
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
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
