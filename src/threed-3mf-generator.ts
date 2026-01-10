import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const saveAs: typeof import("file-saver").saveAs;

export function generate3MF(image: PartListImage, filename: string) {
    const xml = build3MF(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function build3MF(image: PartListImage): string {
    const height = 1.0; // Height of each layer in mm
    const pixelSize = 2.5; // Size of each pixel in mm
    
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    
    // Add resources section with materials and meshes
    modelXml += '  <resources>\n';
    
    // Add base materials for each color
    modelXml += '    <basematerials id="1">\n';
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const color = hex.substring(1); // Remove # prefix
        modelXml += `      <base name="${escapeXml(part.target.name)}" displaycolor="#${color}" />\n`;
    });
    modelXml += '    </basematerials>\n';
    
    // Create a mesh object for each color
    image.partList.forEach((part, partIdx) => {
        const meshId = partIdx + 2; // Start from 2 (1 is basematerials)
        modelXml += `    <object id="${meshId}" type="model">\n`;
        modelXml += '      <mesh>\n';
        modelXml += '        <vertices>\n';
        
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number, number]> = []; // [v1, v2, v3, materialId]
        
        // Find all pixels of this color and create cubes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // Add 8 vertices for the cube
                    vertices.push([x0, y0, z0]); // 0
                    vertices.push([x1, y0, z0]); // 1
                    vertices.push([x1, y1, z0]); // 2
                    vertices.push([x0, y1, z0]); // 3
                    vertices.push([x0, y0, z1]); // 4
                    vertices.push([x1, y0, z1]); // 5
                    vertices.push([x1, y1, z1]); // 6
                    vertices.push([x0, y1, z1]); // 7
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1, partIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2, partIdx]);
                    // Top face (z=height)
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6, partIdx]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7, partIdx]);
                    // Front face (y=y0)
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5, partIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4, partIdx]);
                    // Back face (y=y1)
                    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6, partIdx]);
                    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2, partIdx]);
                    // Left face (x=x0)
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7, partIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3, partIdx]);
                    // Right face (x=x1)
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6, partIdx]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5, partIdx]);
                }
            }
        }
        
        // Write vertices
        vertices.forEach(v => {
            modelXml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
        });
        
        modelXml += '        </vertices>\n';
        modelXml += '        <triangles>\n';
        
        // Write triangles
        triangles.forEach(t => {
            modelXml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${t[3]}" />\n`;
        });
        
        modelXml += '        </triangles>\n';
        modelXml += '      </mesh>\n';
        modelXml += '    </object>\n';
    });
    
    modelXml += '  </resources>\n';
    
    // Build section references all the mesh objects
    modelXml += '  <build>\n';
    image.partList.forEach((part, partIdx) => {
        const meshId = partIdx + 2;
        modelXml += `    <item objectid="${meshId}" />\n`;
    });
    modelXml += '  </build>\n';
    
    modelXml += '</model>\n';
    
    return modelXml;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
