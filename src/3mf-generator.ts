import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string) {
    const content = create3MFContent(image);
    downloadFile(content, `${filename}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

function create3MFContent(image: PartListImage): string {
    // 3MF is an XML-based format for 3D manufacturing
    // We'll create a simple height map where each pixel becomes a vertical column
    
    const height = 2.0; // mm height per layer
    const pixelSize = 1.0; // mm per pixel
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Create a mesh for each color
    let meshId = 1;
    const meshes: Array<{ id: number; colorIndex: number }> = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseIndex = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // Add 8 vertices for the cube
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]); // bottom
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); // top
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIndex + 0, baseIndex + 2, baseIndex + 1]);
                    triangles.push([baseIndex + 0, baseIndex + 3, baseIndex + 2]);
                    // Top face
                    triangles.push([baseIndex + 4, baseIndex + 5, baseIndex + 6]);
                    triangles.push([baseIndex + 4, baseIndex + 6, baseIndex + 7]);
                    // Front face
                    triangles.push([baseIndex + 0, baseIndex + 1, baseIndex + 5]);
                    triangles.push([baseIndex + 0, baseIndex + 5, baseIndex + 4]);
                    // Back face
                    triangles.push([baseIndex + 2, baseIndex + 3, baseIndex + 7]);
                    triangles.push([baseIndex + 2, baseIndex + 7, baseIndex + 6]);
                    // Left face
                    triangles.push([baseIndex + 0, baseIndex + 4, baseIndex + 7]);
                    triangles.push([baseIndex + 0, baseIndex + 7, baseIndex + 3]);
                    // Right face
                    triangles.push([baseIndex + 1, baseIndex + 2, baseIndex + 6]);
                    triangles.push([baseIndex + 1, baseIndex + 6, baseIndex + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${meshId}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            
            for (const [vx, vy, vz] of vertices) {
                xml += `          <vertex x="${vx.toFixed(3)}" y="${vy.toFixed(3)}" z="${vz.toFixed(3)}" />\n`;
            }
            
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            
            for (const [t1, t2, t3] of triangles) {
                xml += `          <triangle v1="${t1}" v2="${t2}" v3="${t3}" />\n`;
            }
            
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
            
            meshes.push({ id: meshId, colorIndex });
            meshId++;
        }
    }
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all meshes to the build
    for (const mesh of meshes) {
        xml += `    <item objectid="${mesh.id}" />\n`;
    }
    
    xml += '  </build>\n';
    xml += '</model>\n';
    
    return xml;
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
