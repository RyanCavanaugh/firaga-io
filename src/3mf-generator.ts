import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    layerHeight: number;
    baseThickness: number;
    filename: string;
};

export function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { layerHeight, baseThickness, filename } = settings;
    
    // Build 3MF XML structure
    const models: string[] = [];
    const resources: string[] = [];
    const items: string[] = [];
    
    let resourceId = 1;
    let objectId = 1;
    
    // Create materials for each color
    const materialIds = new Map<number, number>();
    image.partList.forEach((part, index) => {
        const materialId = resourceId++;
        materialIds.set(index, materialId);
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove #
        resources.push(`    <basematerials id="${materialId}">`);
        resources.push(`      <base name="${part.target.name}" displaycolor="#${hexColor}" />`);
        resources.push(`    </basematerials>`);
    });
    
    // Create mesh object for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Build a mesh for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a voxel (cube) for this pixel
                    const voxelVertices = createVoxel(x, y, layerHeight, baseThickness);
                    const voxelTriangles = createVoxelTriangles(vertexIndex);
                    
                    vertices.push(...voxelVertices);
                    triangles.push(...voxelTriangles);
                    vertexIndex += 8; // 8 vertices per cube
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = objectId++;
            const materialId = materialIds.get(colorIndex)!;
            
            resources.push(`    <object id="${meshId}" type="model" pid="${materialId}" pindex="0">`);
            resources.push(`      <mesh>`);
            resources.push(`        <vertices>`);
            vertices.forEach(v => resources.push(`          ${v}`));
            resources.push(`        </vertices>`);
            resources.push(`        <triangles>`);
            triangles.forEach(t => resources.push(`          ${t}`));
            resources.push(`        </triangles>`);
            resources.push(`      </mesh>`);
            resources.push(`    </object>`);
            
            items.push(`    <item objectid="${meshId}" />`);
        }
    });
    
    // Build complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`;
    
    // Create blob and download
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function createVoxel(x: number, y: number, layerHeight: number, baseThickness: number): string[] {
    // Create 8 vertices for a cube at position (x, y)
    // Each pixel is 1mm x 1mm in the X-Y plane
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = 0;
    const z1 = baseThickness + layerHeight;
    
    return [
        `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
        `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
        `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
        `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
        `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
        `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
        `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
        `<vertex x="${x0}" y="${y1}" z="${z1}" />`
    ];
}

function createVoxelTriangles(startVertex: number): string[] {
    // Create 12 triangles (2 per face) for a cube
    const v = startVertex;
    return [
        // Bottom face
        `<triangle v1="${v + 0}" v2="${v + 1}" v3="${v + 2}" />`,
        `<triangle v1="${v + 0}" v2="${v + 2}" v3="${v + 3}" />`,
        // Top face
        `<triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 5}" />`,
        `<triangle v1="${v + 4}" v2="${v + 7}" v3="${v + 6}" />`,
        // Front face
        `<triangle v1="${v + 0}" v2="${v + 4}" v3="${v + 5}" />`,
        `<triangle v1="${v + 0}" v2="${v + 5}" v3="${v + 1}" />`,
        // Back face
        `<triangle v1="${v + 2}" v2="${v + 6}" v3="${v + 7}" />`,
        `<triangle v1="${v + 2}" v2="${v + 7}" v3="${v + 3}" />`,
        // Left face
        `<triangle v1="${v + 0}" v2="${v + 3}" v3="${v + 7}" />`,
        `<triangle v1="${v + 0}" v2="${v + 7}" v3="${v + 4}" />`,
        // Right face
        `<triangle v1="${v + 1}" v2="${v + 5}" v3="${v + 6}" />`,
        `<triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 2}" />`
    ];
}
