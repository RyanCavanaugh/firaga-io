import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    heightPerLayer: number;
    baseHeight: number;
    pixelSize: number;
}

export function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = create3MFXml(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadFile(blob, "model.3mf", "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function create3MFXml(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, heightPerLayer, baseHeight } = settings;
    
    // Build XML for 3MF file
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials for each color
    xml += '    <basematerials id="1">\n';
    image.partList.forEach((part, idx) => {
        const color = part.target;
        // Convert RGB to hex format for 3MF
        const r = Math.round(color.r).toString(16).padStart(2, '0');
        const g = Math.round(color.g).toString(16).padStart(2, '0');
        const b = Math.round(color.b).toString(16).padStart(2, '0');
        xml += `      <base name="${escapeXml(color.name)}" displaycolor="#${r}${g}${b}FF" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Create mesh objects for each color layer
    let meshId = 2;
    const meshIds: number[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Build vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight + colorIdx * heightPerLayer;
                    const z1 = z0 + heightPerLayer;
                    
                    const baseVertex = vertexCount;
                    
                    // 8 vertices of the cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    vertexCount += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseVertex + 3}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 3}" v2="${baseVertex + 6}" v3="${baseVertex + 2}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${meshId}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += '        <vertices>\n';
            xml += vertices.join('\n') + '\n';
            xml += '        </vertices>\n';
            xml += '        <triangles>\n';
            xml += triangles.join('\n') + '\n';
            xml += '        </triangles>\n';
            xml += '      </mesh>\n';
            xml += '    </object>\n';
            
            meshIds.push(meshId);
            meshId++;
        }
    }
    
    // Create component to combine all meshes
    xml += `    <object id="${meshId}" type="model">\n`;
    xml += '      <components>\n';
    meshIds.forEach((id, idx) => {
        xml += `        <component objectid="${id}" pid="1" pindex="${idx}" />\n`;
    });
    xml += '      </components>\n';
    xml += '    </object>\n';
    
    xml += '  </resources>\n';
    xml += `  <build>\n`;
    xml += `    <item objectid="${meshId}" />\n`;
    xml += `  </build>\n`;
    xml += '</model>';
    
    return xml;
}

function escapeXml(text: string): string {
    return text.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function downloadFile(blob: Blob, filename: string, mimeType: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
