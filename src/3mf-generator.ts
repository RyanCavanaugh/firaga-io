import { PartListImage } from "./image-utils";

export interface ThreeDSettings {
    pitch: number;
    height: number; // Height per layer in mm
    baseHeight: number; // Height of base layer in mm
}

export async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, '3d-model.3mf');
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height, baseHeight } = settings;
    
    let meshId = 1;
    const objects: string[] = [];
    const resources: string[] = [];
    
    // Create a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseIdx = vertices.length;
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = baseHeight + height;
                    
                    // Add 8 vertices for a box
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    const addQuad = (a: number, b: number, c: number, d: number) => {
                        triangles.push([baseIdx + a, baseIdx + b, baseIdx + c]);
                        triangles.push([baseIdx + a, baseIdx + c, baseIdx + d]);
                    };
                    
                    addQuad(0, 1, 2, 3); // bottom
                    addQuad(4, 7, 6, 5); // top
                    addQuad(0, 4, 5, 1); // front
                    addQuad(1, 5, 6, 2); // right
                    addQuad(2, 6, 7, 3); // back
                    addQuad(3, 7, 4, 0); // left
                }
            }
        }
        
        if (vertices.length > 0) {
            const vertexXML = vertices.map(v => `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`).join('\n');
            const triangleXML = triangles.map(t => `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`).join('\n');
            
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const colorHex = rgbToHex(r, g, b);
            
            resources.push(`  <basematerials id="${meshId}">
    <base name="${escapeXml(color.target.name)}" displaycolor="${colorHex}" />
  </basematerials>`);
            
            resources.push(`  <object id="${meshId + 1}" type="model" pid="${meshId}" pindex="0">
    <mesh>
      <vertices>
${vertexXML}
      </vertices>
      <triangles>
${triangleXML}
      </triangles>
    </mesh>
  </object>`);
            
            objects.push(`    <item objectid="${meshId + 1}" />`);
            meshId += 2;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${objects.join('\n')}
  </build>
</model>`;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex.toUpperCase();
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
