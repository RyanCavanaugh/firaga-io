import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DSettings = {
    format: "3mf" | "openscad";
    carveSize: readonly number[];
    pitch: number;
    filename: string;
};

/**
 * Generate a 3MF file (3D Manufacturing Format) with separate material shapes for each color.
 * Creates a triangle mesh representation of the pixel art as a 3D object.
 */
export function generate3MF(image: PartListImage, settings: Export3DSettings): void {
    const { pixels, partList, width, height } = image;
    const { pitch, filename } = settings;
    
    // Height per pixel layer in mm
    const pixelHeight = pitch;
    
    // Build XML structure for 3MF
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXml += '  <resources>\n';
    
    let objectId = 1;
    const objects: string[] = [];
    
    // Create a mesh for each color
    partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        let vertexIndex = 0;
        
        // Helper to add or get vertex index
        const getVertexIndex = (x: number, y: number, z: number): number => {
            const key = `${x},${y},${z}`;
            if (vertexMap.has(key)) {
                return vertexMap.get(key)!;
            }
            vertices.push([x, y, z]);
            vertexMap.set(key, vertexIndex);
            return vertexIndex++;
        };
        
        // Build geometry for this color
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (pixels[row][col] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = col * pitch;
                    const x1 = (col + 1) * pitch;
                    const y0 = row * pitch;
                    const y1 = (row + 1) * pitch;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // Define 8 vertices of the box
                    const v0 = getVertexIndex(x0, y0, z0);
                    const v1 = getVertexIndex(x1, y0, z0);
                    const v2 = getVertexIndex(x1, y1, z0);
                    const v3 = getVertexIndex(x0, y1, z0);
                    const v4 = getVertexIndex(x0, y0, z1);
                    const v5 = getVertexIndex(x1, y0, z1);
                    const v6 = getVertexIndex(x1, y1, z1);
                    const v7 = getVertexIndex(x0, y1, z1);
                    
                    // Create 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([v0, v2, v1]);
                    triangles.push([v0, v3, v2]);
                    
                    // Top face (z=z1)
                    triangles.push([v4, v5, v6]);
                    triangles.push([v4, v6, v7]);
                    
                    // Front face (y=y0)
                    triangles.push([v0, v1, v5]);
                    triangles.push([v0, v5, v4]);
                    
                    // Back face (y=y1)
                    triangles.push([v3, v7, v6]);
                    triangles.push([v3, v6, v2]);
                    
                    // Left face (x=x0)
                    triangles.push([v0, v4, v7]);
                    triangles.push([v0, v7, v3]);
                    
                    // Right face (x=x1)
                    triangles.push([v1, v2, v6]);
                    triangles.push([v1, v6, v5]);
                }
            }
        }
        
        if (vertices.length === 0) return;
        
        // Write mesh object
        let meshXml = `    <object id="${objectId}" type="model">\n`;
        meshXml += '      <mesh>\n';
        meshXml += '        <vertices>\n';
        
        vertices.forEach(([x, y, z]) => {
            meshXml += `          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
        });
        
        meshXml += '        </vertices>\n';
        meshXml += '        <triangles>\n';
        
        triangles.forEach(([v1, v2, v3]) => {
            meshXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        });
        
        meshXml += '        </triangles>\n';
        meshXml += '      </mesh>\n';
        meshXml += `    </object>\n`;
        
        objects.push(meshXml);
        objectId++;
    });
    
    modelXml += objects.join('');
    
    // Add build section
    modelXml += '  </resources>\n';
    modelXml += '  <build>\n';
    for (let i = 1; i < objectId; i++) {
        modelXml += `    <item objectid="${i}" />\n`;
    }
    modelXml += '  </build>\n';
    modelXml += '</model>\n';
    
    // Create blob and download
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}
