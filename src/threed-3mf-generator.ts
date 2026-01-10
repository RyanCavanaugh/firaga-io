import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const saveAs: (blob: Blob, filename: string) => void;

/**
 * Generate a 3MF (3D Manufacturing Format) file with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, filename: string): void {
    loadFileSaverAnd(() => {
        const xml = create3MFContent(image);
        const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
        saveAs(blob, `${filename}.3mf`);
    });
}

function create3MFContent(image: PartListImage): string {
    const pixelHeight = 1.0; // Height of each pixel in mm
    const pixelWidth = 1.0;  // Width of each pixel in mm
    const pixelDepth = 1.0;  // Depth/thickness of each pixel in mm

    const materials: string[] = [];
    const objects: string[] = [];

    // Create materials for each color in the part list
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove '#'
        materials.push(`    <basematerials id="${idx + 1}">
      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />
    </basematerials>`);
    });

    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseVertex = vertexCount;
                    const x0 = x * pixelWidth;
                    const y0 = y * pixelHeight;
                    const x1 = (x + 1) * pixelWidth;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = pixelDepth;

                    // Add 8 vertices for the cube
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}" />`);
                    // Top face
                    triangles.push(`        <triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`);
                    // Front face
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}" />`);
                    // Back face
                    triangles.push(`        <triangle v1="${baseVertex + 3}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 3}" v2="${baseVertex + 6}" v3="${baseVertex + 2}" />`);
                    // Left face
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />`);
                    // Right face
                    triangles.push(`        <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(`    <object id="${colorIdx + 2}" name="${escapeXml(part.target.name)}" type="model" pid="${colorIdx + 1}" pindex="0">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    });

    // Build the complete 3MF XML
    const buildItems = objects.map((_, idx) => `      <item objectid="${idx + 2}" />`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

function escapeXml(text: string): string {
    return text.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

async function loadFileSaverAnd(func: () => void): Promise<void> {
    const tagName = "file-saver-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}
