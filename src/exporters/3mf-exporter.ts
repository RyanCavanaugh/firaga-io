import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';
import { saveAs } from 'file-saver';

export function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MFModel(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MFModel(image: PartListImage): string {
    const height = 2.0; // Height of each pixel in mm
    const pixelSize = 1.0; // Size of each pixel in mm
    
    let vertexId = 1;
    let triangleId = 1;
    const vertices: string[] = [];
    const triangles: string[] = [];
    const materials: Map<string, number> = new Map();
    
    // Create materials for each color
    image.partList.forEach((part, index) => {
        const colorHex = colorEntryToHex(part.target);
        materials.set(part.symbol, index);
    });
    
    // Generate mesh for each pixel
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelIndex = image.pixels[y][x];
            if (pixelIndex === undefined) continue;
            
            const part = image.partList[pixelIndex];
            if (!part) continue;
            
            const materialId = materials.get(part.symbol);
            
            // Create a rectangular prism for this pixel
            const x0 = x * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y0 = y * pixelSize;
            const y1 = (y + 1) * pixelSize;
            const z0 = 0;
            const z1 = height;
            
            // 8 vertices of the cube
            const baseVertexId = vertexId;
            vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
            vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
            vertexId += 8;
            
            // 12 triangles (2 per face, 6 faces)
            const v = baseVertexId - 1; // Adjust for 0-based indexing
            
            // Bottom face (z0)
            triangles.push(`<triangle v1="${v+0}" v2="${v+2}" v3="${v+1}" pid="${materialId}"/>`);
            triangles.push(`<triangle v1="${v+0}" v2="${v+3}" v3="${v+2}" pid="${materialId}"/>`);
            
            // Top face (z1)
            triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" pid="${materialId}"/>`);
            triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" pid="${materialId}"/>`);
            
            // Front face (y0)
            triangles.push(`<triangle v1="${v+0}" v2="${v+1}" v3="${v+5}" pid="${materialId}"/>`);
            triangles.push(`<triangle v1="${v+0}" v2="${v+5}" v3="${v+4}" pid="${materialId}"/>`);
            
            // Back face (y1)
            triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}" pid="${materialId}"/>`);
            triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}" pid="${materialId}"/>`);
            
            // Left face (x0)
            triangles.push(`<triangle v1="${v+0}" v2="${v+4}" v3="${v+7}" pid="${materialId}"/>`);
            triangles.push(`<triangle v1="${v+0}" v2="${v+7}" v3="${v+3}" pid="${materialId}"/>`);
            
            // Right face (x1)
            triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" pid="${materialId}"/>`);
            triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" pid="${materialId}"/>`);
        }
    }
    
    // Generate material definitions
    const materialDefs = image.partList.map((part, index) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove '#'
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `<base name="${part.target.name}" displaycolor="#${hex}"/>`;
    }).join('\n    ');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
      ${materialDefs}
    </basematerials>
    <object id="2" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="2"/>
  </build>
</model>`;
    
    return xml;
}
