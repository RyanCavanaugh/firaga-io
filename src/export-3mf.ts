import { PartListImage } from './image-utils';

/**
 * Generates a 3MF file (3D Manufacturing Format) from a PartListImage.
 * Each color gets its own mesh with triangles forming rectangular voxels.
 */
export function generate3MF(image: PartListImage, voxelHeight: number = 2.5): Blob {
    const xml = build3MFDocument(image, voxelHeight);
    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function build3MFDocument(image: PartListImage, voxelHeight: number): string {
    const materials = image.partList.map((entry, idx) => {
        const { r, g, b } = entry.target;
        const hexColor = rgbToHex(r, g, b);
        return `    <base:material colorid="${idx}" displaycolor="${hexColor}" name="${escapeXml(entry.target.name)}" />`;
    }).join('\n');

    const meshes = image.partList.map((entry, colorIdx) => {
        return buildMeshForColor(image, colorIdx, voxelHeight);
    }).filter(mesh => mesh !== null).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <base:colorgroup id="1">
${materials}
    </base:colorgroup>
${meshes}
  </resources>
  <build>
${image.partList.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n')}
  </build>
</model>`;
}

function buildMeshForColor(image: PartListImage, colorIdx: number, height: number): string | null {
    const vertices: string[] = [];
    const triangles: string[] = [];
    const vertexMap = new Map<string, number>();

    let vertexCount = 0;

    function getOrCreateVertex(x: number, y: number, z: number): number {
        const key = `${x},${y},${z}`;
        const existing = vertexMap.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const idx = vertexCount++;
        vertices.push(`      <vertex x="${x}" y="${y}" z="${z}" />`);
        vertexMap.set(key, idx);
        return idx;
    }

    function addQuad(v0: number, v1: number, v2: number, v3: number): void {
        triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v2}" pid="1" p1="${colorIdx}" />`);
        triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />`);
    }

    // Build voxels for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] !== colorIdx) continue;

            // Create a box at (x, y) with height
            const x0 = x;
            const x1 = x + 1;
            const y0 = y;
            const y1 = y + 1;
            const z0 = 0;
            const z1 = height;

            // Bottom face (z=0)
            const v0 = getOrCreateVertex(x0, y0, z0);
            const v1 = getOrCreateVertex(x1, y0, z0);
            const v2 = getOrCreateVertex(x1, y1, z0);
            const v3 = getOrCreateVertex(x0, y1, z0);

            // Top face (z=height)
            const v4 = getOrCreateVertex(x0, y0, z1);
            const v5 = getOrCreateVertex(x1, y0, z1);
            const v6 = getOrCreateVertex(x1, y1, z1);
            const v7 = getOrCreateVertex(x0, y1, z1);

            // Add all 6 faces
            addQuad(v3, v2, v1, v0); // bottom
            addQuad(v4, v5, v6, v7); // top
            addQuad(v0, v1, v5, v4); // front
            addQuad(v2, v3, v7, v6); // back
            addQuad(v3, v0, v4, v7); // left
            addQuad(v1, v2, v6, v5); // right
        }
    }

    if (vertices.length === 0) {
        return null;
    }

    return `    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
