import { PartListImage } from './image-utils';

/**
 * Generates a 3MF file (3D Manufacturing Format) from a PartListImage.
 * Creates a triangle mesh with separate material shapes for each color.
 */
export function generate3MF(image: PartListImage): Blob {
    const materials = image.partList.map((entry, idx) => ({
        id: idx + 1,
        name: entry.target.name,
        r: entry.target.r,
        g: entry.target.g,
        b: entry.target.b,
    }));

    // Build meshes for each color
    const meshes: Array<{ materialId: number; vertices: number[][]; triangles: number[][] }> = [];
    
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const vertices: number[][] = [];
        const triangles: number[][] = [];
        const vertexMap = new Map<string, number>();

        // Find all pixels of this color and create quads (2 triangles each)
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    // Create a raised cube for this pixel
                    // Each pixel is 1x1 unit in XY, with height 0.2
                    const h = 0.2; // height
                    
                    // Get or create vertices for this cube
                    const v0 = getOrCreateVertex(x, y, 0);
                    const v1 = getOrCreateVertex(x + 1, y, 0);
                    const v2 = getOrCreateVertex(x + 1, y + 1, 0);
                    const v3 = getOrCreateVertex(x, y + 1, 0);
                    const v4 = getOrCreateVertex(x, y, h);
                    const v5 = getOrCreateVertex(x + 1, y, h);
                    const v6 = getOrCreateVertex(x + 1, y + 1, h);
                    const v7 = getOrCreateVertex(x, y + 1, h);

                    // Top face (2 triangles)
                    triangles.push([v4, v5, v6]);
                    triangles.push([v4, v6, v7]);

                    // Bottom face (2 triangles)
                    triangles.push([v0, v2, v1]);
                    triangles.push([v0, v3, v2]);

                    // Side faces (8 triangles total)
                    // Front
                    triangles.push([v0, v1, v5]);
                    triangles.push([v0, v5, v4]);
                    // Right
                    triangles.push([v1, v2, v6]);
                    triangles.push([v1, v6, v5]);
                    // Back
                    triangles.push([v2, v3, v7]);
                    triangles.push([v2, v7, v6]);
                    // Left
                    triangles.push([v3, v0, v4]);
                    triangles.push([v3, v4, v7]);
                }
            }
        }

        if (vertices.length > 0) {
            meshes.push({
                materialId: partIdx + 1,
                vertices,
                triangles,
            });
        }

        function getOrCreateVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            const existing = vertexMap.get(key);
            if (existing !== undefined) {
                return existing;
            }
            const idx = vertices.length;
            vertices.push([x, y, z]);
            vertexMap.set(key, idx);
            return idx;
        }
    }

    // Generate 3MF XML structure
    const xml = build3MFDocument(materials, meshes);
    
    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function build3MFDocument(
    materials: Array<{ id: number; name: string; r: number; g: number; b: number }>,
    meshes: Array<{ materialId: number; vertices: number[][]; triangles: number[][] }>
): string {
    const materialsXml = materials
        .map(m => {
            const color = `#${toHex(m.r)}${toHex(m.g)}${toHex(m.b)}`;
            return `    <basematerials id="${m.id}">
      <base name="${escapeXml(m.name)}" displaycolor="${color}" />
    </basematerials>`;
        })
        .join('\n');

    const objectsXml = meshes
        .map((mesh, idx) => {
            const verticesXml = mesh.vertices
                .map(v => `        <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`)
                .join('\n');
            
            const trianglesXml = mesh.triangles
                .map(t => `        <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="${mesh.materialId}" p1="0" />`)
                .join('\n');

            return `    <object id="${idx + 1}" type="model">
      <mesh>
        <vertices>
${verticesXml}
        </vertices>
        <triangles>
${trianglesXml}
        </triangles>
      </mesh>
    </object>`;
        })
        .join('\n');

    const buildItemsXml = meshes
        .map((_, idx) => `      <item objectid="${idx + 1}" />`)
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materialsXml}
${objectsXml}
  </resources>
  <build>
${buildItemsXml}
  </build>
</model>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
