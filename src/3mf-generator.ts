import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
}

export async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { pixels, width, height, partList } = image;
    const { pitch, height: blockHeight } = settings;
    
    // Generate 3MF file
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Define materials for each color
    partList.forEach((part, index) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        materials.push(`    <base:material name="${part.target.name}" color="#${hex}FF" />`);
    });
    
    // Generate mesh for each color
    partList.forEach((part, index) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === index) {
                    // Create a box at this position
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const z0 = 0;
                    const x1 = x0 + pitch;
                    const y1 = y0 + pitch;
                    const z1 = blockHeight;
                    
                    // 8 vertices of the box
                    const v0 = vertexIndex;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`      <triangle v1="${v0+0}" v2="${v0+2}" v3="${v0+1}" />`);
                    triangles.push(`      <triangle v1="${v0+0}" v2="${v0+3}" v3="${v0+2}" />`);
                    // Top face (z=z1)
                    triangles.push(`      <triangle v1="${v0+4}" v2="${v0+5}" v3="${v0+6}" />`);
                    triangles.push(`      <triangle v1="${v0+4}" v2="${v0+6}" v3="${v0+7}" />`);
                    // Front face (y=y0)
                    triangles.push(`      <triangle v1="${v0+0}" v2="${v0+1}" v3="${v0+5}" />`);
                    triangles.push(`      <triangle v1="${v0+0}" v2="${v0+5}" v3="${v0+4}" />`);
                    // Back face (y=y1)
                    triangles.push(`      <triangle v1="${v0+3}" v2="${v0+6}" v3="${v0+2}" />`);
                    triangles.push(`      <triangle v1="${v0+3}" v2="${v0+7}" v3="${v0+6}" />`);
                    // Left face (x=x0)
                    triangles.push(`      <triangle v1="${v0+0}" v2="${v0+4}" v3="${v0+7}" />`);
                    triangles.push(`      <triangle v1="${v0+0}" v2="${v0+7}" v3="${v0+3}" />`);
                    // Right face (x=x1)
                    triangles.push(`      <triangle v1="${v0+1}" v2="${v0+2}" v3="${v0+6}" />`);
                    triangles.push(`      <triangle v1="${v0+1}" v2="${v0+6}" v3="${v0+5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${index + 1}" type="model" materialid="${index}">
    <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
    </mesh>
  </object>`);
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">Firaga.io 3D Model</metadata>
  <resources>
  <basematerials id="0">
${materials.join('\n')}
  </basematerials>
${objects.join('\n')}
  <build>
${objects.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
  </resources>
</model>`;
    
    // Create a blob and download
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.3mf';
    a.click();
    URL.revokeObjectURL(url);
}
