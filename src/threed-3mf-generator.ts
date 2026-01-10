import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string) {
    const content = create3MFContent(image);
    const blob = new Blob([content], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function create3MFContent(image: PartListImage): string {
    const heightPerLayer = 1; // Height of each pixel layer
    const pixelSize = 5; // Size of each pixel in mm
    
    let vertices = '';
    let triangles = '';
    let vertexCount = 0;
    let triangleCount = 0;
    
    const objects: string[] = [];
    
    // Create a separate object for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        if (!color) continue;
        
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        let localVertexCount = 0;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const z0 = colorIdx * heightPerLayer;
                    const x1 = x0 + pixelSize;
                    const y1 = y0 + pixelSize;
                    const z1 = z0 + heightPerLayer;
                    
                    // Add 8 vertices for the cube
                    const baseIdx = localVertexCount;
                    colorVertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}"/>`
                    );
                    
                    // Add 12 triangles (2 per face * 6 faces)
                    colorTriangles.push(
                        // Bottom face (z=z0)
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}"/>`,
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}"/>`,
                        // Top face (z=z1)
                        `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}"/>`,
                        `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}"/>`,
                        // Front face (y=y0)
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}"/>`,
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}"/>`,
                        // Back face (y=y1)
                        `<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}"/>`,
                        `<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}"/>`,
                        // Left face (x=x0)
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 7}"/>`,
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 3}"/>`,
                        // Right face (x=x1)
                        `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}"/>`,
                        `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}"/>`
                    );
                    
                    localVertexCount += 8;
                }
            }
        }
        
        if (colorVertices.length > 0) {
            const hexColor = colorEntryToHex(color.target);
            const rgbColor = hexToRGB(hexColor);
            const objectId = colorIdx + 2; // Start from 2 (1 is reserved)
            
            objects.push(`
    <object id="${objectId}" name="Color_${color.target.name}" type="model">
      <mesh>
        <vertices>
          ${colorVertices.join('\n          ')}
        </vertices>
        <triangles>
          ${colorTriangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    const materialsXml = image.partList.map((color, idx) => {
        if (!color) return '';
        const hexColor = colorEntryToHex(color.target);
        const rgb = hexToRGB(hexColor);
        const objectId = idx + 2;
        return `      <object objectid="${objectId}" displaycolor="${rgb}"/>`;
    }).filter(x => x).join('\n');
    
    const buildItems = image.partList.map((color, idx) => {
        if (!color) return '';
        const objectId = idx + 2;
        return `    <item objectid="${objectId}"/>`;
    }).filter(x => x).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
  <metadata name="Application">firaga.io</metadata>
  <metadata name="Title">${filename}</metadata>
</model>`;
}

function hexToRGB(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `#${hex.toUpperCase()}`;
}
