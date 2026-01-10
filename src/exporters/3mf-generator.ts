import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { saveAs } from 'file-saver';

export function generate3MF(image: PartListImage, filename: string, gridSize: AppProps["material"]["size"]) {
    const pitch = getPitch(gridSize);
    const height = 2.0; // mm height for each pixel/bead
    
    // Build 3MF XML structure
    const xml = build3MFContent(image, pitch, height);
    
    // 3MF files are ZIP archives containing the model XML
    // For simplicity, we'll create just the XML model file
    // A full 3MF would need proper ZIP packaging with [Content_Types].xml and _rels/.rels
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename.replace('.png', '')}.3mf.xml`);
}

function build3MFContent(image: PartListImage, pitch: number, height: number): string {
    const { width, height: imgHeight, pixels, partList } = image;
    
    let vertexId = 1;
    let triangleId = 1;
    const meshes: string[] = [];
    
    // Create a separate mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        const startVertexId = vertexId;
        
        // Find all pixels of this color and create cubes for them
        for (let y = 0; y < imgHeight; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube (actually a rectangular prism) for this pixel
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = x0 + pitch;
                    const y1 = y0 + pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the cube
                    const cubeVertices = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];
                    
                    cubeVertices.forEach(v => {
                        vertices.push(`<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
                    });
                    
                    // 12 triangles (2 per face, 6 faces)
                    const baseIdx = vertexId - startVertexId;
                    const cubeTriangles = [
                        [baseIdx, baseIdx+1, baseIdx+2], [baseIdx, baseIdx+2, baseIdx+3], // bottom
                        [baseIdx+4, baseIdx+6, baseIdx+5], [baseIdx+4, baseIdx+7, baseIdx+6], // top
                        [baseIdx, baseIdx+4, baseIdx+5], [baseIdx, baseIdx+5, baseIdx+1], // front
                        [baseIdx+2, baseIdx+6, baseIdx+7], [baseIdx+2, baseIdx+7, baseIdx+3], // back
                        [baseIdx, baseIdx+3, baseIdx+7], [baseIdx, baseIdx+7, baseIdx+4], // left
                        [baseIdx+1, baseIdx+5, baseIdx+6], [baseIdx+1, baseIdx+6, baseIdx+2]  // right
                    ];
                    
                    cubeTriangles.forEach(t => {
                        triangles.push(`<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`);
                    });
                    
                    vertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            
            meshes.push(`
    <object id="${colorIdx + 1}" name="${color.target.name}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${meshes.join('\n')}
  </resources>
  <build>
${partList.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}
