import { PartListImage } from "./image-utils";

export interface Export3DSettings {
    format: "3mf" | "openscad-masks";
    pixelHeight: number;
    baseHeight: number;
}

export function export3MF(image: PartListImage, settings: Export3DSettings): void {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadFile(blob, "model.3mf");
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;

    let vertexIndex = 0;
    const vertices: string[] = [];
    const triangles: { verts: string, pid: number }[] = [];

    // Generate a mesh for each color
    partList.forEach((part, colorIndex) => {
        const colorVertices: { x: number, y: number, z: number }[] = [];
        const colorTriangles: number[][] = [];

        // Find all pixels of this color and create boxes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const boxVerts = createBox(x, y, baseHeight, pixelHeight);
                    const startIdx = colorVertices.length;
                    colorVertices.push(...boxVerts);
                    
                    // Create triangles for the box (12 triangles for 6 faces)
                    colorTriangles.push(
                        // Bottom face
                        [startIdx + 0, startIdx + 1, startIdx + 2],
                        [startIdx + 0, startIdx + 2, startIdx + 3],
                        // Top face
                        [startIdx + 4, startIdx + 6, startIdx + 5],
                        [startIdx + 4, startIdx + 7, startIdx + 6],
                        // Front face
                        [startIdx + 0, startIdx + 4, startIdx + 5],
                        [startIdx + 0, startIdx + 5, startIdx + 1],
                        // Back face
                        [startIdx + 2, startIdx + 6, startIdx + 7],
                        [startIdx + 2, startIdx + 7, startIdx + 3],
                        // Left face
                        [startIdx + 0, startIdx + 3, startIdx + 7],
                        [startIdx + 0, startIdx + 7, startIdx + 4],
                        // Right face
                        [startIdx + 1, startIdx + 5, startIdx + 6],
                        [startIdx + 1, startIdx + 6, startIdx + 2]
                    );
                }
            }
        }

        // Add vertices to global list
        colorVertices.forEach(v => {
            vertices.push(`<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`);
        });

        // Add triangles with material reference
        colorTriangles.forEach(tri => {
            triangles.push({
                verts: `<triangle v1="${vertexIndex + tri[0]}" v2="${vertexIndex + tri[1]}" v3="${vertexIndex + tri[2]}" />`,
                pid: colorIndex + 1
            });
        });

        vertexIndex += colorVertices.length;
    });

    // Build 3MF XML
    const materialsXml = partList.map((part, idx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(4);
        const g = (color.g / 255).toFixed(4);
        const b = (color.b / 255).toFixed(4);
        return `    <basematerials id="${idx + 1}">
      <base name="${color.name}" displaycolor="#${rgbToHex(color.r, color.g, color.b)}" />
    </basematerials>`;
    }).join('\n');

    const meshXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materialsXml}
    <object id="1" type="model">
      <mesh>
        <vertices>
${vertices.map(v => '          ' + v).join('\n')}
        </vertices>
        <triangles>
${triangles.map(t => `          ${t.verts.replace('<triangle ', `<triangle pid="${t.pid}" `)}`).join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    return meshXml;
}

function createBox(x: number, y: number, baseZ: number, height: number): { x: number, y: number, z: number }[] {
    const x0 = x, x1 = x + 1;
    const y0 = y, y1 = y + 1;
    const z0 = baseZ, z1 = baseZ + height;

    return [
        // Bottom face
        { x: x0, y: y0, z: z0 },
        { x: x1, y: y0, z: z0 },
        { x: x1, y: y1, z: z0 },
        { x: x0, y: y1, z: z0 },
        // Top face
        { x: x0, y: y0, z: z1 },
        { x: x1, y: y0, z: z1 },
        { x: x1, y: y1, z: z1 },
        { x: x0, y: y1, z: z1 }
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
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
