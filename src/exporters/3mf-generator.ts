import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';
import { Export3DProps } from '../types';
import { saveAs } from 'file-saver';

export interface Export3DSettings {
    layerHeight: number;
    pixelWidth: number;
    pixelHeight: number;
}

export function generate3MF(image: PartListImage, filename: string, settings: Export3DProps): void {
    const exportSettings: Export3DSettings = {
        layerHeight: settings.layerHeight,
        pixelWidth: settings.pixelWidth,
        pixelHeight: settings.pixelHeight
    };

    const modelXml = build3MFModel(image, exportSettings);
    const contentTypesXml = buildContentTypes();
    const relsXml = buildRels();
    
    // Create zip using JSZip would be ideal, but we'll use a simple approach
    // For now, create the XML and let user save it
    // In production, you'd want to properly create a .3mf file (which is a zip)
    
    const blob = create3MFZip(modelXml, contentTypesXml, relsXml);
    saveAs(blob, `${filename}.3mf`);
}

function build3MFModel(image: PartListImage, settings: Export3DSettings): string {
    const { layerHeight, pixelWidth, pixelHeight } = settings;
    
    let meshesXml = '';
    let objectsXml = '';
    let componentsXml = '';
    let baseMaterialsXml = '<basematerials id="1">\n';
    
    // Create a base material for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        baseMaterialsXml += `  <base name="${part.target.name}" displaycolor="#${color}" />\n`;
    });
    baseMaterialsXml += '</basematerials>\n';
    
    let objectId = 2; // Start at 2 since basematerials is 1
    
    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number, number]> = []; // vertex indices + material
        let vertexIndex = 0;
        
        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = layerHeight;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexIndex;
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    vertexIndex += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1, colorIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2, colorIdx]);
                    // Top face (z=z1)
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6, colorIdx]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7, colorIdx]);
                    // Front face (y=y0)
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5, colorIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4, colorIdx]);
                    // Back face (y=y1)
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7, colorIdx]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6, colorIdx]);
                    // Left face (x=x0)
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7, colorIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3, colorIdx]);
                    // Right face (x=x1)
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6, colorIdx]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5, colorIdx]);
                }
            }
        }
        
        if (vertices.length > 0) {
            let meshXml = `<mesh>\n<vertices>\n`;
            vertices.forEach(v => {
                meshXml += `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            meshXml += `</vertices>\n<triangles>\n`;
            triangles.forEach(t => {
                meshXml += `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${t[3]}" />\n`;
            });
            meshXml += `</triangles>\n</mesh>\n`;
            
            objectsXml += `<object id="${objectId}" type="model" pid="1" pindex="${colorIdx}">\n${meshXml}</object>\n`;
            componentsXml += `<component objectid="${objectId}" />\n`;
            objectId++;
        }
    });
    
    const buildXml = `<build>\n<item objectid="${objectId}" />\n</build>\n`;
    const componentObjectXml = `<object id="${objectId}" type="model">\n<components>\n${componentsXml}</components>\n</object>\n`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
<resources>
${baseMaterialsXml}
${objectsXml}
${componentObjectXml}
</resources>
${buildXml}
</model>`;
}

function buildContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function buildRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function create3MFZip(modelXml: string, contentTypesXml: string, relsXml: string): Blob {
    // This is a simplified implementation
    // In a real implementation, you would use JSZip or similar to create a proper ZIP file
    // For now, we'll create a simple text file with the model XML
    // The user would need to manually create the .3mf structure
    
    // Basic ZIP file creation (simplified - would need proper ZIP library)
    const encoder = new TextEncoder();
    const modelData = encoder.encode(modelXml);
    const contentTypesData = encoder.encode(contentTypesXml);
    const relsData = encoder.encode(relsXml);
    
    // For now, just return the model XML as a blob
    // TODO: Implement proper ZIP creation with JSZip
    return new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}
