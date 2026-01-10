import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export interface ThreeMFSettings {
    pitch: number;
    height: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeMFSettings) {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeMFSettings): string {
    const { width, height, partList, pixels } = image;
    const { pitch } = settings;
    const layerHeight = settings.height;
    
    let modelXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXML += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXML += '  <resources>\n';
    
    // Define base colors
    modelXML += '    <basematerials id="1">\n';
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        // Convert hex to RGB values (0-1 range)
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        modelXML += `      <base name="${part.target.name}" displaycolor="${hex.slice(1)}" />\n`;
    });
    modelXML += '    </basematerials>\n';
    
    // Create mesh objects for each color
    partList.forEach((part, colorIdx) => {
        const meshId = colorIdx + 2;
        modelXML += `    <object id="${meshId}" type="model" pid="1" pindex="${colorIdx}">\n`;
        modelXML += '      <mesh>\n';
        modelXML += '        <vertices>\n';
        
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate vertices and triangles for pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = layerHeight;
                    
                    const baseIdx = vertices.length;
                    
                    // 8 vertices for a box
                    vertices.push(
                        [x0, y0, z0], // 0
                        [x1, y0, z0], // 1
                        [x1, y1, z0], // 2
                        [x0, y1, z0], // 3
                        [x0, y0, z1], // 4
                        [x1, y0, z1], // 5
                        [x1, y1, z1], // 6
                        [x0, y1, z1]  // 7
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face
                    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6]);
                    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2]);
                    // Left face
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        // Write vertices
        vertices.forEach(v => {
            modelXML += `          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />\n`;
        });
        
        modelXML += '        </vertices>\n';
        modelXML += '        <triangles>\n';
        
        // Write triangles
        triangles.forEach(t => {
            modelXML += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />\n`;
        });
        
        modelXML += '        </triangles>\n';
        modelXML += '      </mesh>\n';
        modelXML += '    </object>\n';
    });
    
    // Build structure
    modelXML += '    <object id="' + (partList.length + 2) + '" type="model">\n';
    modelXML += '      <components>\n';
    partList.forEach((_, idx) => {
        const meshId = idx + 2;
        modelXML += `        <component objectid="${meshId}" />\n`;
    });
    modelXML += '      </components>\n';
    modelXML += '    </object>\n';
    
    modelXML += '  </resources>\n';
    modelXML += '  <build>\n';
    modelXML += `    <item objectid="${partList.length + 2}" />\n`;
    modelXML += '  </build>\n';
    modelXML += '</model>\n';
    
    return modelXML;
}
