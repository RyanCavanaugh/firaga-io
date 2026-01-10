import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface Export3MFSettings {
    pitch: number;
    height: number;
    filename: string;
}

export function export3MF(image: PartListImage, settings: Export3MFSettings): void {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadFile(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3MFSettings): string {
    const pitch = settings.pitch;
    const height = settings.height;
    
    let objectId = 1;
    const objects: string[] = [];
    const materials: string[] = [];
    const components: string[] = [];
    
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1);
        
        const materialId = partIndex + 1;
        materials.push(`    <base:basematerial name="${escapeXml(color.name)}" displaycolor="#${hexColor}" />`);
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    
                    const baseIdx = vertexIndex;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="0" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="0" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="0" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="0" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${height}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${height}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${height}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${height}" />`);
                    
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    
                    // Front face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    
                    // Right face
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    // Back face
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    
                    // Left face
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${objectId}" type="model">
    <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
    </mesh>
  </object>`);
            
            components.push(`    <component objectid="${objectId}" />`);
            objectId++;
        }
    }
    
    const buildObjectId = objectId;
    const buildObject = `  <object id="${buildObjectId}" type="model">
${components.join('\n')}
  </object>`;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${objects.join('\n')}
${buildObject}
  </resources>
  <build>
    <item objectid="${buildObjectId}" />
  </build>
</model>`;
    
    return xml;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
