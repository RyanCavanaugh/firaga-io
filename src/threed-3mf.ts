import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export function generate3MF(image: PartListImage, filename: string) {
    const xml = create3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function create3MFContent(image: PartListImage): string {
    // 3MF file structure
    const pixelHeight = 1.0; // Height of each pixel/bead in mm
    const pixelSize = 2.5; // Size of each pixel in mm (approximate bead size)
    
    let vertices: string[] = [];
    let triangles: string[] = [];
    let vertexIndex = 0;
    
    // Build meshes for each color
    const colorMeshes: Map<number, { vertices: string[], triangles: string[] }> = new Map();
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const meshData = { vertices: [] as string[], triangles: [] as string[] };
        let localVertexIndex = 0;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const z0 = 0;
                    const x1 = x0 + pixelSize;
                    const y1 = y0 + pixelSize;
                    const z1 = z0 + pixelHeight;
                    
                    // Add 8 vertices for the cube
                    const baseIdx = localVertexIndex;
                    meshData.vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    
                    // Add 12 triangles for the 6 faces of the cube
                    // Bottom face
                    meshData.triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    meshData.triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    meshData.triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    meshData.triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    meshData.triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    meshData.triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    meshData.triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    meshData.triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face
                    meshData.triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx}" v3="${baseIdx + 4}" />`);
                    meshData.triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face
                    meshData.triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    meshData.triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    localVertexIndex += 8;
                }
            }
        }
        
        if (meshData.vertices.length > 0) {
            colorMeshes.set(colorIdx, meshData);
        }
    }
    
    // Build 3MF XML
    let objectsXML = '';
    let buildItemsXML = '';
    let materialsXML = '<basematerials id="1">\n';
    
    let objectId = 2;
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        if (!part || !colorMeshes.has(colorIdx)) continue;
        
        const meshData = colorMeshes.get(colorIdx)!;
        
        // Add material
        const r = part.color.r;
        const g = part.color.g;
        const b = part.color.b;
        const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        materialsXML += `  <base name="${part.name}" displaycolor="${colorHex}" />\n`;
        
        // Add mesh object
        objectsXML += `  <object id="${objectId}" type="model">\n`;
        objectsXML += `    <mesh>\n`;
        objectsXML += `      <vertices>\n`;
        objectsXML += meshData.vertices.map(v => '        ' + v).join('\n') + '\n';
        objectsXML += `      </vertices>\n`;
        objectsXML += `      <triangles>\n`;
        objectsXML += meshData.triangles.map(t => '        ' + t).join('\n') + '\n';
        objectsXML += `      </triangles>\n`;
        objectsXML += `    </mesh>\n`;
        objectsXML += `  </object>\n`;
        
        // Add to build
        buildItemsXML += `    <item objectid="${objectId}" />\n`;
        
        objectId++;
    }
    
    materialsXML += '</basematerials>\n';
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Application">Firaga.io</metadata>
  <resources>
${materialsXML}
${objectsXML}
  </resources>
  <build>
${buildItemsXML}
  </build>
</model>`;
    
    return xml;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}
