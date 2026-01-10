import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDMFSettings {
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    baseThickness: number;
}

/**
 * Generate a 3MF file (3D Manufacturing Format) containing a triangle mesh
 * with separate material shapes for each color in the image.
 */
export function generate3MF(image: PartListImage, settings: ThreeDMFSettings): void {
    const xml = build3MFDocument(image, settings);
    
    // Create blob and download
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, `${settings.filename}.3mf`);
}

function build3MFDocument(image: PartListImage, settings: ThreeDMFSettings): string {
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    
    let vertexId = 1;
    let triangleId = 1;
    const meshes: string[] = [];
    const resources: string[] = [];
    
    // Create materials for each color
    const materials = image.partList.map((part, index) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        return `    <basematerials id="${index + 1}">
      <base name="${part.target.name}" displaycolor="#${color}FF" />
    </basematerials>`;
    }).join('\n');
    
    resources.push(materials);
    
    // Create mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        const startVertexId = vertexId;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const cubeData = createCube(
                        x * pixelWidth,
                        y * pixelHeight,
                        0,
                        pixelWidth,
                        pixelHeight,
                        baseThickness,
                        vertexId
                    );
                    
                    vertices.push(...cubeData.vertices);
                    triangles.push(...cubeData.triangles);
                    vertexId = cubeData.nextVertexId;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = colorIndex + 100;
            const mesh = `    <object id="${meshId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
            
            resources.push(mesh);
            meshes.push(`      <component objectid="${meshId}" />`);
        }
    });
    
    const document = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
    <object id="1" type="model">
      <components>
${meshes.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
    
    return document;
}

interface CubeData {
    vertices: string[];
    triangles: string[];
    nextVertexId: number;
}

/**
 * Create vertices and triangles for a single cube (pixel).
 */
function createCube(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    startId: number
): CubeData {
    const vertices: string[] = [];
    const triangles: string[] = [];
    
    // 8 vertices of the cube
    const v = [
        [x, y, z],                           // 0: bottom-front-left
        [x + width, y, z],                   // 1: bottom-front-right
        [x + width, y + height, z],          // 2: bottom-back-right
        [x, y + height, z],                  // 3: bottom-back-left
        [x, y, z + depth],                   // 4: top-front-left
        [x + width, y, z + depth],           // 5: top-front-right
        [x + width, y + height, z + depth],  // 6: top-back-right
        [x, y + height, z + depth]           // 7: top-back-left
    ];
    
    v.forEach(([vx, vy, vz]) => {
        vertices.push(`          <vertex x="${vx}" y="${vy}" z="${vz}" />`);
    });
    
    // 12 triangles (2 per face, 6 faces)
    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0]  // left
    ];
    
    faces.forEach(([a, b, c]) => {
        triangles.push(`          <triangle v1="${startId + a}" v2="${startId + b}" v3="${startId + c}" />`);
    });
    
    return {
        vertices,
        triangles,
        nextVertexId: startId + 8
    };
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
