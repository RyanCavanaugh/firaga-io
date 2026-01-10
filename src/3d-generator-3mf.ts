import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage): string {
    const width = image.width;
    const height = image.height;
    const depth = 1.0; // Height of each pixel in 3D space
    
    // Build separate meshes for each color
    const meshes: string[] = [];
    const objects: string[] = [];
    
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // For each pixel with this color, create a box
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseIdx = vertexIndex;
                    
                    // Define 8 vertices for a box at position (x, y)
                    // Bottom face (z=0)
                    vertices.push(`<vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="0" />`);
                    // Top face (z=depth)
                    vertices.push(`<vertex x="${x}" y="${y}" z="${depth}" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="${depth}" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="${depth}" />`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="${depth}" />`);
                    
                    // Define 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" />`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" />`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" />`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" />`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = colorIndex + 1;
            const objectId = colorIndex + 1;
            const hex = colorEntryToHex(part.target).substring(1); // Remove #
            
            meshes.push(`    <mesh>
      <vertices>
${vertices.join('\n        ')}
      </vertices>
      <triangles>
${triangles.join('\n        ')}
      </triangles>
    </mesh>`);
            
            objects.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n          ')}
        </vertices>
        <triangles>
${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`);
        }
    });
    
    // Build complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
    <basematerials id="1">
${image.partList.map((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        return `      <base name="${part.target.name}" displaycolor="#${hex}" />`;
    }).join('\n')}
    </basematerials>
  </resources>
  <build>
${image.partList.map((part, idx) => {
        return `    <item objectid="${idx + 1}" />`;
    }).join('\n')}
  </build>
</model>`;
    
    return xml;
}
