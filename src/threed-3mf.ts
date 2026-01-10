import { PartListImage } from "./image-utils";

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFDocument(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, `${filename}.3mf`);
}

function build3MFDocument(image: PartListImage): string {
    const meshes: string[] = [];
    const resources: string[] = [];
    let resourceId = 1;
    
    // Create a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const baseIdx = vertexIndex;
                    
                    // 8 vertices for a unit cube at position (x, y, 0)
                    vertices.push(`<vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="0" />`);
                    vertices.push(`<vertex x="${x}" y="${y}" z="1" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="1" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="1" />`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="1" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face (z=1)
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face (y=0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face (y=1)
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face (x=0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Right face (x=1)
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            
            // Convert RGB (0-255) to sRGB color space (0-1)
            const sR = (r / 255).toFixed(6);
            const sG = (g / 255).toFixed(6);
            const sB = (b / 255).toFixed(6);
            
            resources.push(`  <basematerials id="${resourceId}">
    <base name="${escapeXml(color.target.name)}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />
  </basematerials>
  <object id="${resourceId + 1}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n        ')}
      </vertices>
      <triangles>
${triangles.join('\n        ')}
      </triangles>
    </mesh>
  </object>`);
            
            meshes.push(`    <item objectid="${resourceId + 1}" />`);
            resourceId += 2;
        }
    }
    
    const doc = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${meshes.join('\n')}
  </build>
</model>`;
    
    return doc;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
