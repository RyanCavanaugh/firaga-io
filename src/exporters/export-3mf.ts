import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

export function export3MF(image: PartListImage, filename: string): void {
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, `${filename}.3mf`);
}

function generate3MFContent(image: PartListImage): string {
    const voxelSize = 1.0; // Size of each voxel in mm
    const height = 2.0; // Height of each voxel in mm
    
    let objectId = 1;
    const objects: string[] = [];
    const items: string[] = [];
    const resources: string[] = [];
    
    // Create color materials
    const colorMap = new Map<number, number>();
    image.partList.forEach((part, index) => {
        const colorId = index + 1;
        colorMap.set(index, colorId);
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        resources.push(`    <basematerials id="${colorId}">`);
        resources.push(`      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`);
        resources.push(`    </basematerials>`);
    });
    
    // Create mesh for each color
    image.partList.forEach((part, partIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: number[] = [];
        const vertexMap = new Map<string, number>();
        
        function getOrCreateVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            let idx = vertexMap.get(key);
            if (idx === undefined) {
                idx = vertices.length;
                vertices.push([x, y, z]);
                vertexMap.set(key, idx);
            }
            return idx;
        }
        
        // Generate mesh for pixels of this color
        for (let py = 0; py < image.height; py++) {
            for (let px = 0; px < image.width; px++) {
                if (image.pixels[py][px] === partIndex) {
                    // Create a box (cube) for this pixel
                    const x0 = px * voxelSize;
                    const x1 = (px + 1) * voxelSize;
                    const y0 = py * voxelSize;
                    const y1 = (py + 1) * voxelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the cube
                    const v0 = getOrCreateVertex(x0, y0, z0);
                    const v1 = getOrCreateVertex(x1, y0, z0);
                    const v2 = getOrCreateVertex(x1, y1, z0);
                    const v3 = getOrCreateVertex(x0, y1, z0);
                    const v4 = getOrCreateVertex(x0, y0, z1);
                    const v5 = getOrCreateVertex(x1, y0, z1);
                    const v6 = getOrCreateVertex(x1, y1, z1);
                    const v7 = getOrCreateVertex(x0, y1, z1);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(v0, v2, v1, v0, v3, v2);
                    // Top face (z=height)
                    triangles.push(v4, v5, v6, v4, v6, v7);
                    // Front face (y=y0)
                    triangles.push(v0, v1, v5, v0, v5, v4);
                    // Back face (y=y1)
                    triangles.push(v3, v7, v6, v3, v6, v2);
                    // Left face (x=x0)
                    triangles.push(v0, v4, v7, v0, v7, v3);
                    // Right face (x=x1)
                    triangles.push(v1, v2, v6, v1, v6, v5);
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = objectId++;
            const materialId = colorMap.get(partIndex)!;
            
            objects.push(`    <object id="${meshId}" type="model">`);
            objects.push(`      <mesh>`);
            objects.push(`        <vertices>`);
            vertices.forEach(([x, y, z]) => {
                objects.push(`          <vertex x="${x}" y="${y}" z="${z}" />`);
            });
            objects.push(`        </vertices>`);
            objects.push(`        <triangles>`);
            for (let i = 0; i < triangles.length; i += 3) {
                objects.push(`          <triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" pid="${materialId}" p1="0" />`);
            }
            objects.push(`        </triangles>`);
            objects.push(`      </mesh>`);
            objects.push(`    </object>`);
            
            items.push(`    <item objectid="${meshId}" />`);
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`;
    
    return xml;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
