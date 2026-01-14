import { PartListImage, PartListEntry } from './image-utils';
import { colorEntryToHex } from './utils';

/**
 * Generates a 3MF file (3D Model Format) with separate triangle meshes for each color.
 * Each color gets its own mesh object with distinct material.
 * Note: Creates a model.xml file since proper 3MF ZIP creation requires a library.
 */
export function generate3MF(image: PartListImage, filename: string) {
    const cellSize = 1;
    const height = 1;

    // Create mesh data for all colors
    let vertexIndex = 0;
    const allVertices: string[] = [];
    const allTriangles: string[] = [];
    let objectId = 2;
    const materials: Map<number, string> = new Map();
    let materialId = 1;

    // Build material definitions and meshes for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const colorHex = colorEntryToHex(part.target);
        materials.set(materialId, colorHex);

        // Create mesh for this color
        const meshData = createMeshForColor(image, partIndex, cellSize, height, vertexIndex, materialId);
        allVertices.push(...meshData.vertexLines);
        allTriangles.push(...meshData.triangleLines);
        vertexIndex = meshData.nextVertexIndex;
        materialId++;
    }

    const model3mfXml = create3MFDocument(allVertices, allTriangles, Array.from(materials.entries()));
    downloadFile(model3mfXml, `${filename}.xml`, 'application/xml');
}

function createMeshForColor(
    image: PartListImage,
    partIndex: number,
    cellSize: number,
    height: number,
    startVertexIndex: number,
    materialId: number
) {
    const vertexLines: string[] = [];
    const triangleLines: string[] = [];
    let vertexIndex = startVertexIndex;

    // Find all pixels for this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                // Create a unit cube for this pixel
                const px = x * cellSize;
                const py = y * cellSize;

                const verts = [
                    [px, py, 0],
                    [px + cellSize, py, 0],
                    [px + cellSize, py + cellSize, 0],
                    [px, py + cellSize, 0],
                    [px, py, height],
                    [px + cellSize, py, height],
                    [px + cellSize, py + cellSize, height],
                    [px, py + cellSize, height],
                ];

                const baseIndex = vertexIndex;
                for (const [vx, vy, vz] of verts) {
                    vertexLines.push(`<vertex x="${vx.toFixed(3)}" y="${vy.toFixed(3)}" z="${vz.toFixed(3)}" />`);
                    vertexIndex++;
                }

                // Bottom face (z=0)
                triangleLines.push(`<triangle v1="${baseIndex}" v2="${baseIndex + 1}" v3="${baseIndex + 2}" pid="${materialId}" />`);
                triangleLines.push(`<triangle v1="${baseIndex}" v2="${baseIndex + 2}" v3="${baseIndex + 3}" pid="${materialId}" />`);

                // Top face (z=height)
                triangleLines.push(`<triangle v1="${baseIndex + 4}" v2="${baseIndex + 6}" v3="${baseIndex + 5}" pid="${materialId}" />`);
                triangleLines.push(`<triangle v1="${baseIndex + 4}" v2="${baseIndex + 7}" v3="${baseIndex + 6}" pid="${materialId}" />`);

                // Front face (y=py)
                triangleLines.push(`<triangle v1="${baseIndex}" v2="${baseIndex + 5}" v3="${baseIndex + 1}" pid="${materialId}" />`);
                triangleLines.push(`<triangle v1="${baseIndex}" v2="${baseIndex + 4}" v3="${baseIndex + 5}" pid="${materialId}" />`);

                // Back face (y=py+cellSize)
                triangleLines.push(`<triangle v1="${baseIndex + 2}" v2="${baseIndex + 6}" v3="${baseIndex + 7}" pid="${materialId}" />`);
                triangleLines.push(`<triangle v1="${baseIndex + 2}" v2="${baseIndex + 7}" v3="${baseIndex + 3}" pid="${materialId}" />`);

                // Left face (x=px)
                triangleLines.push(`<triangle v1="${baseIndex + 3}" v2="${baseIndex + 7}" v3="${baseIndex + 4}" pid="${materialId}" />`);
                triangleLines.push(`<triangle v1="${baseIndex + 3}" v2="${baseIndex + 4}" v3="${baseIndex}" pid="${materialId}" />`);

                // Right face (x=px+cellSize)
                triangleLines.push(`<triangle v1="${baseIndex + 1}" v2="${baseIndex + 5}" v3="${baseIndex + 6}" pid="${materialId}" />`);
                triangleLines.push(`<triangle v1="${baseIndex + 1}" v2="${baseIndex + 6}" v3="${baseIndex + 2}" pid="${materialId}" />`);
            }
        }
    }

    return { vertexLines, triangleLines, nextVertexIndex: vertexIndex };
}

function create3MFDocument(vertexLines: string[], triangleLines: string[], materials: Array<[number, string]>) {
    let materialXml = '';
    for (const [id, colorHex] of materials) {
        materialXml += `<material id="${id}" type="rgb"><color hex="${colorHex.toUpperCase()}FF" /></material>\n`;
    }

    const vertexXml = vertexLines.join('\n');
    const triangleXml = triangleLines.join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2013/12">
    <metadata name="Title">Firaga 3D Export</metadata>
    <metadata name="Designer">firaga.io</metadata>
    <resources>
        <material id="1">
            ${materialXml}
        </material>
        <object id="1" type="model">
            <mesh>
                <vertices>
                    ${vertexXml}
                </vertices>
                <triangles>
                    ${triangleXml}
                </triangles>
            </mesh>
        </object>
    </resources>
    <build>
        <item objectid="1" />
    </build>
</model>`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
