import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

/**
 * Generates a 3MF (3D Manufacturing Format) file with separate material shapes for each color.
 * The 3MF format is an industry-standard XML-based format for 3D printing.
 */
export function generate3MF(image: PartListImage, filename: string): void {
    const pixelHeight = 1.0; // Height of each pixel in mm
    const pixelWidth = 1.0;  // Width of each pixel in mm
    
    // Build the 3D model XML
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexIndex = 0;
    
    // Map to track which colors are used and their material IDs
    const colorMaterialMap = new Map<string, number>();
    let materialId = 0;
    
    // Group triangles by color for separate object definitions
    const trianglesByColor = new Map<string, string[]>();
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const partIndex = image.pixels[y][x];
            if (partIndex === undefined) continue;
            
            const part = image.partList[partIndex];
            if (!part) continue;
            
            const colorHex = colorEntryToHex(part.target);
            
            // Register color/material if not seen before
            if (!colorMaterialMap.has(colorHex)) {
                colorMaterialMap.set(colorHex, materialId++);
                trianglesByColor.set(colorHex, []);
            }
            
            // Create a cube for this pixel
            // Bottom-left corner is at (x * pixelWidth, y * pixelWidth, 0)
            const x0 = x * pixelWidth;
            const x1 = (x + 1) * pixelWidth;
            const y0 = y * pixelWidth;
            const y1 = (y + 1) * pixelWidth;
            const z0 = 0;
            const z1 = pixelHeight;
            
            // Define 8 vertices of the cube
            const v: Array<[number, number, number]> = [
                [x0, y0, z0], // 0
                [x1, y0, z0], // 1
                [x1, y1, z0], // 2
                [x0, y1, z0], // 3
                [x0, y0, z1], // 4
                [x1, y0, z1], // 5
                [x1, y1, z1], // 6
                [x0, y1, z1], // 7
            ];
            
            const baseIdx = vertexIndex;
            for (const [vx, vy, vz] of v) {
                vertices.push(`    <vertex x="${vx}" y="${vy}" z="${vz}" />`);
            }
            
            // Create 12 triangles (2 per face, 6 faces)
            const faces: Array<[number, number, number]> = [
                // Bottom face (z=0)
                [0, 2, 1], [0, 3, 2],
                // Top face (z=1)
                [4, 5, 6], [4, 6, 7],
                // Front face (y=0)
                [0, 1, 5], [0, 5, 4],
                // Back face (y=1)
                [2, 3, 7], [2, 7, 6],
                // Left face (x=0)
                [0, 4, 7], [0, 7, 3],
                // Right face (x=1)
                [1, 2, 6], [1, 6, 5],
            ];
            
            const colorTriangles = trianglesByColor.get(colorHex)!;
            for (const [i0, i1, i2] of faces) {
                colorTriangles.push(
                    `      <triangle v1="${baseIdx + i0}" v2="${baseIdx + i1}" v3="${baseIdx + i2}" />`
                );
            }
            
            vertexIndex += 8;
        }
    }
    
    // Build the 3MF XML document
    const xmlParts: string[] = [];
    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push('<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">');
    xmlParts.push('  <resources>');
    
    // Define materials
    xmlParts.push('    <basematerials id="1">');
    for (const [colorHex, matId] of colorMaterialMap.entries()) {
        const colorRGB = colorHex.replace('#', '');
        xmlParts.push(`      <base name="Color${matId}" displaycolor="${colorRGB}" />`);
    }
    xmlParts.push('    </basematerials>');
    
    // Define objects (one per color)
    let objectId = 2;
    for (const [colorHex, matId] of colorMaterialMap.entries()) {
        xmlParts.push(`    <object id="${objectId}" type="model">`);
        xmlParts.push('      <mesh>');
        xmlParts.push('        <vertices>');
        xmlParts.push(vertices.join('\n'));
        xmlParts.push('        </vertices>');
        xmlParts.push('        <triangles>');
        const colorTriangles = trianglesByColor.get(colorHex)!;
        xmlParts.push(colorTriangles.join('\n'));
        xmlParts.push('        </triangles>');
        xmlParts.push('      </mesh>');
        xmlParts.push('    </object>');
        objectId++;
    }
    
    xmlParts.push('  </resources>');
    xmlParts.push('  <build>');
    
    // Reference all objects in the build
    objectId = 2;
    for (const _ of colorMaterialMap.keys()) {
        xmlParts.push(`    <item objectid="${objectId}" />`);
        objectId++;
    }
    
    xmlParts.push('  </build>');
    xmlParts.push('</model>');
    
    const xmlContent = xmlParts.join('\n');
    
    // Download the file
    downloadFile(xmlContent, `${filename}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
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
