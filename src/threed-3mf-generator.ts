import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const saveAs: any;

export function make3MF(image: PartListImage, filename: string) {
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    
    // Use FileSaver if available
    if (typeof saveAs !== "undefined") {
        saveAs(blob, `${filename}.3mf`);
    } else {
        // Fallback to direct download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.3mf`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function generate3MFContent(image: PartListImage): string {
    const height = 2.0; // Height in mm for each pixel
    const pixelSize = 1.0; // Size of each pixel in mm
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials for each color
    xml += '    <basematerials id="1">\n';
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        xml += `      <base name="${part.target.name}" displaycolor="${hex}" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Generate mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the box
                    vertices.push([x0, y0, z0]); // 0
                    vertices.push([x1, y0, z0]); // 1
                    vertices.push([x1, y1, z0]); // 2
                    vertices.push([x0, y1, z0]); // 3
                    vertices.push([x0, y0, z1]); // 4
                    vertices.push([x1, y0, z1]); // 5
                    vertices.push([x1, y1, z1]); // 6
                    vertices.push([x0, y1, z1]); // 7
                    
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
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left face
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${colorIdx + 2}" type="model">\n`;
            xml += '      <mesh>\n';
            xml += '        <vertices>\n';
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            xml += '        </vertices>\n';
            xml += '        <triangles>\n';
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" p1="${colorIdx}" />\n`;
            });
            xml += '        </triangles>\n';
            xml += '      </mesh>\n';
            xml += '    </object>\n';
        }
    });
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all objects to the build
    image.partList.forEach((part, colorIdx) => {
        xml += `    <item objectid="${colorIdx + 2}" />\n`;
    });
    
    xml += '  </build>\n';
    xml += '</model>\n';
    
    return xml;
}
