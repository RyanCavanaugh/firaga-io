import { saveAs } from 'file-saver';
import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

export function generate3MF(image: PartListImage, filename: string) {
    const xml = create3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function create3MFContent(image: PartListImage): string {
    const voxelSize = 1.0; // Size of each voxel in mm
    const baseHeight = 1.0; // Height of base layer
    const pixelHeight = 1.0; // Height per pixel/color layer
    
    let vertexId = 0;
    let triangleId = 0;
    const vertices: string[] = [];
    const triangles: string[] = [];
    const materials: Map<number, { name: string; color: string }> = new Map();
    
    // Create materials for each color
    image.partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        materials.set(idx, {
            name: entry.target.name,
            color: hex
        });
    });
    
    // Generate mesh for each pixel
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIndex = image.pixels[y][x];
            if (colorIndex === undefined) continue;
            
            const materialId = colorIndex;
            
            // Create a cube (voxel) for this pixel
            const x0 = x * voxelSize;
            const x1 = (x + 1) * voxelSize;
            const y0 = y * voxelSize;
            const y1 = (y + 1) * voxelSize;
            const z0 = 0;
            const z1 = baseHeight + pixelHeight;
            
            const startVertex = vertexId;
            
            // 8 vertices of the cube
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
            const faces = [
                [0, 1, 2], [0, 2, 3], // Bottom
                [4, 6, 5], [4, 7, 6], // Top
                [0, 4, 5], [0, 5, 1], // Front
                [1, 5, 6], [1, 6, 2], // Right
                [2, 6, 7], [2, 7, 3], // Back
                [3, 7, 4], [3, 4, 0]  // Left
            ];
            
            faces.forEach(face => {
                triangles.push(`<triangle v1="${startVertex + face[0]}" v2="${startVertex + face[1]}" v3="${startVertex + face[2]}" pid="${materialId}"/>`);
            });
        }
    }
    
    // Build material definitions
    const materialDefs = Array.from(materials.entries()).map(([id, mat]) => {
        const rgb = hexToRgb(mat.color);
        return `<base name="${escapeXml(mat.name)}" displaycolor="${rgb}"/>`;
    }).join('\n    ');
    
    // Build property definitions
    const propertyDefs = Array.from(materials.entries()).map(([id]) => {
        return `<property id="${id}" type="basematerial" materialid="0"/>`;
    }).join('\n    ');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="0">
      ${materialDefs}
    </basematerials>
    <object id="1" type="model">
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
    <item objectid="1"/>
  </build>
</model>`;
}

function hexToRgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `#${hex.toUpperCase()}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
