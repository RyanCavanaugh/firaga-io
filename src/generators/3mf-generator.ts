import { saveAs } from 'file-saver';
import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage): string {
    const meshes: string[] = [];
    const resources: string[] = [];
    let resourceId = 1;
    
    // Process each color in the part list
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels with this color and create a mesh
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a unit cube for this pixel (voxel)
                    const baseIdx = vertexIndex;
                    
                    // Add 8 vertices for the cube (x, y, z)
                    vertices.push(
                        `<vertex x="${x}" y="${y}" z="0" />`,
                        `<vertex x="${x + 1}" y="${y}" z="0" />`,
                        `<vertex x="${x + 1}" y="${y + 1}" z="0" />`,
                        `<vertex x="${x}" y="${y + 1}" z="0" />`,
                        `<vertex x="${x}" y="${y}" z="1" />`,
                        `<vertex x="${x + 1}" y="${y}" z="1" />`,
                        `<vertex x="${x + 1}" y="${y + 1}" z="1" />`,
                        `<vertex x="${x}" y="${y + 1}" z="1" />`
                    );
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(
                        `<triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" />`,
                        `<triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" />`
                    );
                    // Top face (z=1)
                    triangles.push(
                        `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`,
                        `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`
                    );
                    // Front face (y=0)
                    triangles.push(
                        `<triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" />`,
                        `<triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" />`
                    );
                    // Back face (y=1)
                    triangles.push(
                        `<triangle v1="${baseIdx + 3}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`,
                        `<triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`
                    );
                    // Left face (x=0)
                    triangles.push(
                        `<triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`,
                        `<triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" />`
                    );
                    // Right face (x=1)
                    triangles.push(
                        `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`,
                        `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`
                    );
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = colorEntryToHex(entry.target).substring(1); // Remove # prefix
            const baseMaterialId = resourceId;
            resourceId++;
            
            resources.push(`
                <basematerials id="${baseMaterialId}">
                    <base name="${escapeXml(entry.target.name)}" displaycolor="#${colorHex}" />
                </basematerials>
            `);
            
            const objectId = resourceId;
            resourceId++;
            
            meshes.push(`
                <object id="${objectId}" type="model">
                    <mesh>
                        <vertices>
                            ${vertices.join('\n                            ')}
                        </vertices>
                        <triangles>
                            ${triangles.join('\n                            ')}
                        </triangles>
                    </mesh>
                </object>
            `);
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        ${resources.join('\n        ')}
        ${meshes.join('\n        ')}
    </resources>
    <build>
        ${meshes.map((_, idx) => `<item objectid="${2 + idx * 2}" />`).join('\n        ')}
    </build>
</model>`;
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
