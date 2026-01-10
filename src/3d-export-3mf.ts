import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string) {
    const xml = create3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function create3MFContent(image: PartListImage): string {
    const pixelSize = 1.0; // 1mm per pixel
    const height = 2.0; // 2mm tall
    
    let objectsXml = '';
    let resourcesXml = '';
    let buildItemsXml = '';
    
    // Create materials for each color
    let baseMaterialsXml = '';
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        baseMaterialsXml += `    <base name="${part.target.name}" displaycolor="#${color}FF" />\n`;
    });
    
    resourcesXml += `  <basematerials id="1">\n${baseMaterialsXml}  </basematerials>\n`;
    
    // Create mesh for each color
    image.partList.forEach((part, materialIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // For each pixel of this color, create a cube
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the cube
                    const v0 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    const v1 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    const v2 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    const v3 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    const v4 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    const v5 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    const v6 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    const v7 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${v3}" v2="${v0}" v3="${v4}" />`);
                    triangles.push(`      <triangle v1="${v3}" v2="${v4}" v3="${v7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            const objectId = materialIdx + 2;
            objectsXml += `  <object id="${objectId}" type="model" pid="1" pindex="${materialIdx}">\n`;
            objectsXml += `    <mesh>\n`;
            objectsXml += `    <vertices>\n${vertices.join('\n')}\n    </vertices>\n`;
            objectsXml += `    <triangles>\n${triangles.join('\n')}\n    </triangles>\n`;
            objectsXml += `    </mesh>\n`;
            objectsXml += `  </object>\n`;
            
            buildItemsXml += `    <item objectid="${objectId}" />\n`;
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<resources>
${resourcesXml}${objectsXml}</resources>
<build>
${buildItemsXml}</build>
</model>`;
    
    return xml;
}
