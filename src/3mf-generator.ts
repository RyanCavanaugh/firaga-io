import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type ThreeMFSettings = {
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
};

export function generate3MF(image: PartListImage, settings: ThreeMFSettings) {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeMFSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, pixelWidth } = settings;
    
    let meshes = '';
    let objectId = 1;
    const objects: string[] = [];
    
    // Create a mesh for each color
    partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        // Build mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    addCube(x, y, vertices, triangles, vertexMap, pixelWidth, pixelHeight);
                }
            }
        }
        
        if (vertices.length > 0) {
            const verticesXml = vertices.map(([x, y, z]) => 
                `      <vertex x="${x}" y="${y}" z="${z}" />`
            ).join('\n');
            
            const trianglesXml = triangles.map(([v1, v2, v3]) => 
                `      <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
            ).join('\n');
            
            const colorHex = rgbToHex(part.target.r, part.target.g, part.target.b);
            
            objects.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${verticesXml}
        </vertices>
        <triangles>
${trianglesXml}
        </triangles>
      </mesh>
    </object>`);
            
            meshes += `    <item objectid="${objectId}" />\n`;
            objectId++;
        }
    });
    
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${meshes}
  </build>
</model>`;
    
    return content;
}

function addCube(
    x: number, 
    y: number, 
    vertices: Array<[number, number, number]>, 
    triangles: Array<[number, number, number]>,
    vertexMap: Map<string, number>,
    pixelWidth: number,
    pixelHeight: number
) {
    const x0 = x * pixelWidth;
    const x1 = (x + 1) * pixelWidth;
    const y0 = y * pixelWidth;
    const y1 = (y + 1) * pixelWidth;
    const z0 = 0;
    const z1 = pixelHeight;
    
    // Define the 8 vertices of the cube
    const cubeVertices: Array<[number, number, number]> = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom face
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top face
    ];
    
    const vertexIndices: number[] = [];
    
    // Add vertices and track their indices
    for (const vertex of cubeVertices) {
        const key = vertex.join(',');
        let index = vertexMap.get(key);
        if (index === undefined) {
            index = vertices.length;
            vertices.push(vertex);
            vertexMap.set(key, index);
        }
        vertexIndices.push(index);
    }
    
    // Define triangles for each face (counter-clockwise winding)
    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0]  // left
    ];
    
    for (const face of faces) {
        triangles.push([
            vertexIndices[face[0]], 
            vertexIndices[face[1]], 
            vertexIndices[face[2]]
        ]);
    }
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
