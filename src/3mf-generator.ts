import { PartListImage } from "./image-utils";
import { AppProps } from "./types";
import { getPitch, colorEntryToHex } from "./utils";
import * as FileSaver from 'file-saver';

export async function generate3MF(
    image: PartListImage,
    gridSize: AppProps["material"]["size"],
    filename: string
): Promise<void> {
    const pitch = getPitch(gridSize);
    const xml = create3MFModel(image, pitch);
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    FileSaver.saveAs(blob, `${filename}.3mf`);
}

function create3MFModel(image: PartListImage, pitch: number): string {
    const { width, height, partList, pixels } = image;
    
    const baseHeight = 0.5;
    const pixelHeight = 1.0;
    
    let meshContent = '';
    let objectId = 1;
    const objectRefs: string[] = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    addPixelCube(vertices, triangles, x, y, pitch, baseHeight, pixelHeight);
                }
            }
        }
        
        if (vertices.length > 0) {
            const color = colorEntryToHex(part.target).substring(1);
            meshContent += createMeshObject(objectId, vertices, triangles, color, part.target.name);
            objectRefs.push(`<item objectid="${objectId}" />`);
            objectId++;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(image.partList[0]?.target.name || 'Model')}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${partList.map((part, idx) => {
    const color = colorEntryToHex(part.target).substring(1);
    return `      <base name="${escapeXml(part.target.name)}" displaycolor="#${color}" />`;
}).join('\n')}
    </basematerials>
${meshContent}
  </resources>
  <build>
${objectRefs.join('\n    ')}
  </build>
</model>`;
}

function addPixelCube(
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    x: number,
    y: number,
    pitch: number,
    baseHeight: number,
    pixelHeight: number
): void {
    const baseIdx = vertices.length;
    
    const x0 = x * pitch;
    const x1 = (x + 1) * pitch;
    const y0 = y * pitch;
    const y1 = (y + 1) * pitch;
    const z0 = 0;
    const z1 = baseHeight + pixelHeight;
    
    vertices.push(
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
    );
    
    const faces = [
        [0, 1, 2], [0, 2, 3],
        [4, 6, 5], [4, 7, 6],
        [0, 4, 5], [0, 5, 1],
        [1, 5, 6], [1, 6, 2],
        [2, 6, 7], [2, 7, 3],
        [3, 7, 4], [3, 4, 0]
    ];
    
    for (const [a, b, c] of faces) {
        triangles.push([baseIdx + a, baseIdx + b, baseIdx + c]);
    }
}

function createMeshObject(
    id: number,
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    color: string,
    name: string
): string {
    const vertexStr = vertices.map(([x, y, z]) => 
        `      <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />`
    ).join('\n');
    
    const triangleStr = triangles.map(([v1, v2, v3]) =>
        `      <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
    ).join('\n');
    
    return `    <object id="${id}" name="${escapeXml(name)}" type="model">
      <mesh>
        <vertices>
${vertexStr}
        </vertices>
        <triangles>
${triangleStr}
        </triangles>
      </mesh>
    </object>
`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
