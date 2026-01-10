import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const saveAs: typeof import("file-saver").saveAs;

export function generate3MF(image: PartListImage, filename: string) {
    const xml = create3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function create3MFContent(image: PartListImage): string {
    const xmlns = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Define materials for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <basematerials id="${idx + 1}">
      <base name="${escapeXml(part.target.name)}" displaycolor="#${color}FF" />
    </basematerials>`);
    });

    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Collect all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube at position (x, y, 0) with dimensions 1x1x1
                    const baseIdx = vertexCount;
                    
                    // Define 8 vertices of the cube
                    vertices.push(
                        `      <vertex x="${x}" y="${y}" z="0" />`,
                        `      <vertex x="${x + 1}" y="${y}" z="0" />`,
                        `      <vertex x="${x + 1}" y="${y + 1}" z="0" />`,
                        `      <vertex x="${x}" y="${y + 1}" z="0" />`,
                        `      <vertex x="${x}" y="${y}" z="1" />`,
                        `      <vertex x="${x + 1}" y="${y}" z="1" />`,
                        `      <vertex x="${x + 1}" y="${y + 1}" z="1" />`,
                        `      <vertex x="${x}" y="${y + 1}" z="1" />`
                    );

                    // Define 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" pid="1" p1="0" />`,
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" pid="1" p1="0" />`
                    );
                    // Top face
                    triangles.push(
                        `      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" pid="1" p1="0" />`,
                        `      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" pid="1" p1="0" />`
                    );
                    // Front face
                    triangles.push(
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" pid="1" p1="0" />`,
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" pid="1" p1="0" />`
                    );
                    // Back face
                    triangles.push(
                        `      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" pid="1" p1="0" />`,
                        `      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" pid="1" p1="0" />`
                    );
                    // Left face
                    triangles.push(
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" pid="1" p1="0" />`,
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" pid="1" p1="0" />`
                    );
                    // Right face
                    triangles.push(
                        `      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" pid="1" p1="0" />`,
                        `      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" pid="1" p1="0" />`
                    );

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(`  <object id="${colorIdx + 1}" type="model" pid="${colorIdx + 1}" pindex="0">
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

    const buildItems = objects.map((_, idx) => 
        `    <item objectid="${idx + 1}" />`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="${xmlns}">
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
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
