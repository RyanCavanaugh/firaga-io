import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';
import JSZip from 'jszip';

/**
 * Generates a 3MF file from a PartListImage
 * 3MF is an XML-based format for 3D manufacturing
 */
export async function generate3MF(image: PartListImage, voxelHeight: number = 1): Promise<Blob> {
    const modelXml = build3MFModel(image, voxelHeight);
    const contentTypes = buildContentTypes();
    const rels = buildRels();

    // 3MF files are ZIP archives with a specific structure
    const zip = new JSZip();
    zip.file('3D/3dmodel.model', modelXml);
    zip.file('[Content_Types].xml', contentTypes);
    zip.file('_rels/.rels', rels);

    return await zip.generateAsync({ type: 'blob' });
}

function build3MFModel(image: PartListImage, voxelHeight: number): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';

    // Define base colors as materials
    const colorToMaterialId = new Map<number, number>();
    image.partList.forEach((part, idx) => {
        const materialId = idx + 1;
        colorToMaterialId.set(idx, materialId);
        const hex = colorEntryToHex(part.target);
        xml += `    <basematerials id="${materialId}">\n`;
        xml += `      <base name="${escapeXml(part.target.name)}" displaycolor="${hex.substring(1)}" />\n`;
        xml += `    </basematerials>\n`;
    });

    // Create mesh objects for each color
    let objectId = image.partList.length + 1;
    const colorMeshIds = new Map<number, number>();

    image.partList.forEach((part, colorIdx) => {
        const meshId = objectId++;
        colorMeshIds.set(colorIdx, meshId);

        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number, number]> = []; // [v1, v2, v3, materialId]
        const vertexMap = new Map<string, number>();

        function getOrCreateVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            let idx = vertexMap.get(key);
            if (idx === undefined) {
                idx = vertices.length;
                vertices.push([x, y, z]);
                vertexMap.set(key, idx);
            }
            return idx;
        }

        // Build voxel mesh for this color
        for (let row = 0; row < image.height; row++) {
            for (let col = 0; col < image.width; col++) {
                if (image.pixels[row][col] === colorIdx) {
                    // Create a cube at this position
                    const x0 = col;
                    const y0 = row;
                    const z0 = 0;
                    const x1 = col + 1;
                    const y1 = row + 1;
                    const z1 = voxelHeight;

                    // 8 vertices of the cube
                    const v000 = getOrCreateVertex(x0, y0, z0);
                    const v001 = getOrCreateVertex(x0, y0, z1);
                    const v010 = getOrCreateVertex(x0, y1, z0);
                    const v011 = getOrCreateVertex(x0, y1, z1);
                    const v100 = getOrCreateVertex(x1, y0, z0);
                    const v101 = getOrCreateVertex(x1, y0, z1);
                    const v110 = getOrCreateVertex(x1, y1, z0);
                    const v111 = getOrCreateVertex(x1, y1, z1);

                    const matId = colorToMaterialId.get(colorIdx)!;

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([v000, v100, v110, matId]);
                    triangles.push([v000, v110, v010, matId]);
                    // Top face (z=z1)
                    triangles.push([v001, v011, v111, matId]);
                    triangles.push([v001, v111, v101, matId]);
                    // Front face (y=y0)
                    triangles.push([v000, v001, v101, matId]);
                    triangles.push([v000, v101, v100, matId]);
                    // Back face (y=y1)
                    triangles.push([v010, v110, v111, matId]);
                    triangles.push([v010, v111, v011, matId]);
                    // Left face (x=x0)
                    triangles.push([v000, v010, v011, matId]);
                    triangles.push([v000, v011, v001, matId]);
                    // Right face (x=x1)
                    triangles.push([v100, v101, v111, matId]);
                    triangles.push([v100, v111, v110, matId]);
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${meshId}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(([x, y, z]) => {
                xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(([v1, v2, v3, matId]) => {
                xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${matId}" p1="0" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });

    // Create a build item that references all meshes
    xml += '  </resources>\n';
    xml += '  <build>\n';
    colorMeshIds.forEach((meshId) => {
        xml += `    <item objectid="${meshId}" />\n`;
    });
    xml += '  </build>\n';
    xml += '</model>\n';

    return xml;
}

function buildContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>
`;
}

function buildRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>
`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
