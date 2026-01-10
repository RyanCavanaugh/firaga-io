import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export interface ThreeDSettings {
    pitch: number;
    carveSize: readonly [number, number];
    filename: string;
    format: "3mf" | "openscad-masks";
}

export function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const voxelHeight = 2.0; // Height of each voxel in mm
    const voxelSize = settings.pitch * 25.4; // Convert pitch from inches to mm
    
    // Build 3MF XML structure
    let modelXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXML += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXML += '  <resources>\n';
    
    // Define colors as base materials
    const colorMap = new Map<string, number>();
    let baseMaterialId = 1;
    image.partList.forEach(part => {
        const colorHex = colorEntryToHex(part.target);
        if (!colorMap.has(colorHex)) {
            const colorId = baseMaterialId++;
            colorMap.set(colorHex, colorId);
            // 3MF uses sRGB color format
            modelXML += `    <basematerials id="${colorId}">\n`;
            modelXML += `      <base name="${part.target.name}" displaycolor="${colorHex.substring(1)}" />\n`;
            modelXML += `    </basematerials>\n`;
        }
    });
    
    // Create meshes for each color
    let objectId = baseMaterialId;
    const meshObjects: number[] = [];
    
    for (const [colorHex, materialId] of colorMap.entries()) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate vertices and triangles for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelColor = image.pixels[y][x];
                if (pixelColor === undefined) continue;
                
                const part = image.partList[pixelColor];
                const pixelColorHex = colorEntryToHex(part.target);
                
                if (pixelColorHex !== colorHex) continue;
                
                // Create a box (cuboid) for this voxel
                const x0 = x * voxelSize;
                const x1 = (x + 1) * voxelSize;
                const y0 = y * voxelSize;
                const y1 = (y + 1) * voxelSize;
                const z0 = 0;
                const z1 = voxelHeight;
                
                // 8 vertices of the box
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
                // Bottom face (z=0)
                triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                // Top face (z=z1)
                triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                // Front face (y=y0)
                triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                // Back face (y=y1)
                triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                // Left face (x=x0)
                triangles.push(`      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`);
                triangles.push(`      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`);
                // Right face (x=x1)
                triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
            }
        }
        
        if (vertices.length > 0) {
            modelXML += `    <object id="${objectId}" type="model">\n`;
            modelXML += `      <mesh>\n`;
            modelXML += `    <vertices>\n`;
            modelXML += vertices.join('\n') + '\n';
            modelXML += `    </vertices>\n`;
            modelXML += `    <triangles>\n`;
            modelXML += triangles.join('\n') + '\n';
            modelXML += `    </triangles>\n`;
            modelXML += `      </mesh>\n`;
            modelXML += `    </object>\n`;
            meshObjects.push(objectId);
            objectId++;
        }
    }
    
    modelXML += '  </resources>\n';
    modelXML += '  <build>\n';
    
    // Add all objects to the build
    meshObjects.forEach(id => {
        modelXML += `    <item objectid="${id}" />\n`;
    });
    
    modelXML += '  </build>\n';
    modelXML += '</model>\n';
    
    // Create the 3MF file (which is a ZIP archive)
    // For simplicity, we'll use the model XML directly
    // A proper implementation would create a ZIP with the model and other required files
    const blob = new Blob([modelXML], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}
