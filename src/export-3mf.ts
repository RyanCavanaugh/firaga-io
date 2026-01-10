import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export type Export3MFSettings = {
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    baseHeight: number;
};

export function export3MF(image: PartListImage, settings: Export3MFSettings) {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3MFSettings): string {
    const { pixelWidth, pixelHeight, baseHeight } = settings;
    
    let objectId = 1;
    const objects: string[] = [];
    const components: string[] = [];
    
    // Create a mesh object for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const cubeVertices = createCubeVertices(
                        x * pixelWidth,
                        y * pixelWidth,
                        0,
                        pixelWidth,
                        pixelHeight,
                        pixelHeight
                    );
                    
                    cubeVertices.forEach(v => {
                        vertices.push(`<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
                    });
                    
                    const cubeTriangles = createCubeTriangles(vertexIndex);
                    triangles.push(...cubeTriangles);
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const color = part.target;
            const r = color.r / 255;
            const g = color.g / 255;
            const b = color.b / 255;
            
            objects.push(`
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`);
            
            components.push(`<component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0" p:color="#${rgbToHex(color.r, color.g, color.b)}" />`);
            objectId++;
        }
    });
    
    const buildObjectId = objectId;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <resources>
${objects.join('\n')}
    <object id="${buildObjectId}" type="model">
      ${components.join('\n      ')}
    </object>
  </resources>
  <build>
    <item objectid="${buildObjectId}" />
  </build>
</model>`;
}

function createCubeVertices(x: number, y: number, z: number, w: number, h: number, d: number): number[][] {
    return [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + h, z],
        [x, y + h, z],
        [x, y, z + d],
        [x + w, y, z + d],
        [x + w, y + h, z + d],
        [x, y + h, z + d]
    ];
}

function createCubeTriangles(baseIndex: number): string[] {
    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0]  // left
    ];
    
    return faces.map(f => 
        `<triangle v1="${baseIndex + f[0]}" v2="${baseIndex + f[1]}" v3="${baseIndex + f[2]}" />`
    );
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
