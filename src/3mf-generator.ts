import { PartListImage } from "./image-utils";

/**
 * Generates a 3MF (3D Manufacturing Format) file containing a triangle mesh
 * with separate material shapes for each color in the image.
 */
export function generate3MF(image: PartListImage, heightMm: number, filename: string): void {
    const xml = create3MFContent(image, heightMm);
    downloadFile(`${filename}.3mf`, xml, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function create3MFContent(image: PartListImage, heightMm: number): string {
    const pixelSizeMm = 1.0; // Each pixel is 1mm x 1mm
    
    // Build mesh with separate objects for each color
    let objectsXml = '';
    let meshId = 1;
    const build: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    addCube(
                        x * pixelSizeMm,
                        y * pixelSizeMm,
                        0,
                        pixelSizeMm,
                        pixelSizeMm,
                        heightMm,
                        vertices,
                        triangles,
                        vertexMap
                    );
                }
            }
        }
        
        if (vertices.length === 0) continue;
        
        // Generate mesh XML
        const verticesXml = vertices.map(([x, y, z]) => 
            `      <vertex x="${x}" y="${y}" z="${z}" />`
        ).join('\n');
        
        const trianglesXml = triangles.map(([v1, v2, v3]) =>
            `      <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
        ).join('\n');
        
        const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
        
        objectsXml += `  <object id="${meshId}" type="model">
    <mesh>
      <vertices>
${verticesXml}
      </vertices>
      <triangles>
${trianglesXml}
      </triangles>
    </mesh>
  </object>
`;
        
        build.push(`    <item objectid="${meshId}" />`);
        meshId++;
    }
    
    const buildXml = build.join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXml}  </resources>
  <build>
${buildXml}
  </build>
</model>`;
}

function addCube(
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    vertexMap: Map<string, number>
): void {
    const corners: Array<[number, number, number]> = [
        [x, y, z],
        [x + width, y, z],
        [x + width, y + depth, z],
        [x, y + depth, z],
        [x, y, z + height],
        [x + width, y, z + height],
        [x + width, y + depth, z + height],
        [x, y + depth, z + height]
    ];
    
    const getOrAddVertex = (vx: number, vy: number, vz: number): number => {
        const key = `${vx},${vy},${vz}`;
        let idx = vertexMap.get(key);
        if (idx === undefined) {
            idx = vertices.length;
            vertices.push([vx, vy, vz]);
            vertexMap.set(key, idx);
        }
        return idx;
    };
    
    const v = corners.map(([vx, vy, vz]) => getOrAddVertex(vx, vy, vz));
    
    // Define 12 triangles (2 per face, 6 faces)
    const faces: Array<[number, number, number]> = [
        // Bottom
        [v[0], v[2], v[1]], [v[0], v[3], v[2]],
        // Top
        [v[4], v[5], v[6]], [v[4], v[6], v[7]],
        // Front
        [v[0], v[1], v[5]], [v[0], v[5], v[4]],
        // Back
        [v[2], v[3], v[7]], [v[2], v[7], v[6]],
        // Left
        [v[0], v[4], v[7]], [v[0], v[7], v[3]],
        // Right
        [v[1], v[2], v[6]], [v[1], v[6], v[5]]
    ];
    
    triangles.push(...faces);
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number): string => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
