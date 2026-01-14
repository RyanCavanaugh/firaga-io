import { PartListImage } from "./image-utils";

/**
 * Generates a 3MF file from a PartListImage.
 * Creates separate material shapes for each color.
 */
export function make3mf(image: PartListImage, height: number, filename: string): void {
    const xml = generate3mfXml(image, height);
    downloadFile(xml, `${filename}.3mf`, "application/vnd.ms-package.3dmodel+xml");
}

function generate3mfXml(image: PartListImage, height: number): string {
    const xmlns = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
    const scale = 1; // Units are in mm

    // Build vertex and triangle data for each color
    const colorMeshes: Array<{ colorIndex: number; triangles: Array<readonly [number, number, number]>; vertices: Array<readonly [number, number, number]> }> = [];

    // Generate a box mesh for each pixel
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIndex = image.pixels[y][x];
            if (colorIndex === -1) continue;

            let colorMesh = colorMeshes.find(m => m.colorIndex === colorIndex);
            if (!colorMesh) {
                colorMesh = { colorIndex, triangles: [], vertices: [] };
                colorMeshes.push(colorMesh);
            }

            const vertexOffset = colorMesh.vertices.length;

            // Create a box at (x, y, 0) with height
            const vertices = createBoxVertices(x, y, height, scale);
            colorMesh.vertices.push(...vertices);

            // Create triangles for the box (12 triangles = 2 per face, 6 faces)
            const triangles = createBoxTriangles(vertexOffset);
            colorMesh.triangles.push(...triangles);
        }
    }

    let objectsXml = '';
    for (let meshIndex = 0; meshIndex < colorMeshes.length; meshIndex++) {
        const mesh = colorMeshes[meshIndex];
        const color = image.partList[mesh.colorIndex];
        const colorHex = `FF${((color.target.r << 16) | (color.target.g << 8) | color.target.b).toString(16).padStart(6, '0').toUpperCase()}`;

        objectsXml += `    <object id="${meshIndex + 2}" type="model">
      <mesh>
        <vertices>
`;
        for (const [vx, vy, vz] of mesh.vertices) {
            objectsXml += `          <vertex x="${(vx * scale).toFixed(3)}" y="${(vy * scale).toFixed(3)}" z="${(vz * scale).toFixed(3)}" />
`;
        }
        objectsXml += `        </vertices>
        <triangles>
`;
        for (const [i1, i2, i3] of mesh.triangles) {
            objectsXml += `          <triangle v1="${i1}" v2="${i2}" v3="${i3}" />
`;
        }
        objectsXml += `        </triangles>
      </mesh>
    </object>
`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="${xmlns}" xmlns:p="${xmlns}/prtypes">
  <metadata name="Title">${escapeXml(filename)}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
${objectsXml}  </resources>
  <build>
    <item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0" />
  </build>
</model>
`;
    return xml;
}

function createBoxVertices(x: number, y: number, height: number, scale: number): Array<readonly [number, number, number]> {
    const vertices: Array<[number, number, number]> = [];
    const size = 1 * scale;
    const h = height * scale;

    // Bottom face (z=0)
    vertices.push([x * scale, y * scale, 0]);
    vertices.push([(x + size) * scale, y * scale, 0]);
    vertices.push([(x + size) * scale, (y + size) * scale, 0]);
    vertices.push([x * scale, (y + size) * scale, 0]);

    // Top face (z=height)
    vertices.push([x * scale, y * scale, h]);
    vertices.push([(x + size) * scale, y * scale, h]);
    vertices.push([(x + size) * scale, (y + size) * scale, h]);
    vertices.push([x * scale, (y + size) * scale, h]);

    return vertices;
}

function createBoxTriangles(offset: number): Array<readonly [number, number, number]> {
    const triangles: Array<[number, number, number]> = [];

    // Bottom face
    triangles.push([offset + 0, offset + 1, offset + 2]);
    triangles.push([offset + 0, offset + 2, offset + 3]);

    // Top face
    triangles.push([offset + 4, offset + 6, offset + 5]);
    triangles.push([offset + 4, offset + 7, offset + 6]);

    // Front face (y=0)
    triangles.push([offset + 0, offset + 5, offset + 1]);
    triangles.push([offset + 0, offset + 4, offset + 5]);

    // Back face (y=1)
    triangles.push([offset + 2, offset + 3, offset + 7]);
    triangles.push([offset + 2, offset + 7, offset + 6]);

    // Left face (x=0)
    triangles.push([offset + 3, offset + 4, offset + 7]);
    triangles.push([offset + 3, offset + 0, offset + 4]);

    // Right face (x=1)
    triangles.push([offset + 1, offset + 6, offset + 2]);
    triangles.push([offset + 1, offset + 5, offset + 6]);

    return triangles;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
