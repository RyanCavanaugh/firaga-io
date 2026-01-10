import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeMFSettings = {
    heightPerColor: number;
    pixelSize: number;
    baseHeight: number;
};

export function generate3MF(image: PartListImage, settings: ThreeMFSettings): Blob {
    const xml = create3MFContent(image, settings);
    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function create3MFContent(image: PartListImage, settings: ThreeMFSettings): string {
    const { heightPerColor, pixelSize, baseHeight } = settings;
    
    let objectId = 1;
    const objects: string[] = [];
    const materials: string[] = [];
    const components: string[] = [];
    
    // Create materials for each color in the part list
    image.partList.forEach((part, index) => {
        const hexColor = colorEntryToHex(part.target);
        const rgb = hexToRgb(hexColor);
        materials.push(`<base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />`);
    });
    
    // Generate meshes for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels with this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight;
                    const z1 = baseHeight + heightPerColor;
                    
                    // 8 vertices of the box
                    const v = vertexIndex;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face)
                    // Bottom
                    triangles.push(`<triangle v1="${v+0}" v2="${v+2}" v3="${v+1}" />`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+3}" v3="${v+2}" />`);
                    // Top
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" />`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" />`);
                    // Front
                    triangles.push(`<triangle v1="${v+0}" v2="${v+1}" v3="${v+5}" />`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+5}" v3="${v+4}" />`);
                    // Back
                    triangles.push(`<triangle v1="${v+3}" v2="${v+7}" v3="${v+6}" />`);
                    triangles.push(`<triangle v1="${v+3}" v2="${v+6}" v3="${v+2}" />`);
                    // Left
                    triangles.push(`<triangle v1="${v+0}" v2="${v+4}" v3="${v+7}" />`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+7}" v3="${v+3}" />`);
                    // Right
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" />`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`<object id="${objectId}" type="model" pid="${colorIndex + 1}">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`);
            components.push(`<component objectid="${objectId}" />`);
            objectId++;
        }
    });
    
    const buildObjectId = objectId;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="1">
      ${materials.join('\n      ')}
    </basematerials>
    ${objects.join('\n    ')}
    <object id="${buildObjectId}" type="model">
      <components>
        ${components.join('\n        ')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${buildObjectId}" />
  </build>
</model>`;
}

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${hex.slice(1).toUpperCase()}`;
}

function escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
}
