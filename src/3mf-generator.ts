import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    gridSize: string;
}

/**
 * Generates a 3MF file containing a triangle mesh with separate material shapes for each color.
 * 3MF is the standard 3D manufacturing format.
 */
export function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const xml = create3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadFile(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage): string {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Define materials (colors)
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove # prefix
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        materials.push(`    <basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`);
    });

    // Create mesh objects for each color
    let vertexOffset = 0;
    image.partList.forEach((part, materialIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexCount = 0;

        // Generate vertices and triangles for pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    // Create a cube for this pixel
                    const x0 = x;
                    const y0 = y;
                    const z0 = 0;
                    const x1 = x + 1;
                    const y1 = y + 1;
                    const z1 = 1;

                    const vStart = localVertexCount;
                    
                    // 8 vertices of the cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    localVertexCount += 8;

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${vStart}" v2="${vStart + 1}" v3="${vStart + 2}" />`);
                    triangles.push(`      <triangle v1="${vStart}" v2="${vStart + 2}" v3="${vStart + 3}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${vStart + 4}" v2="${vStart + 6}" v3="${vStart + 5}" />`);
                    triangles.push(`      <triangle v1="${vStart + 4}" v2="${vStart + 7}" v3="${vStart + 6}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${vStart}" v2="${vStart + 4}" v3="${vStart + 5}" />`);
                    triangles.push(`      <triangle v1="${vStart}" v2="${vStart + 5}" v3="${vStart + 1}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${vStart + 3}" v2="${vStart + 2}" v3="${vStart + 6}" />`);
                    triangles.push(`      <triangle v1="${vStart + 3}" v2="${vStart + 6}" v3="${vStart + 7}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${vStart}" v2="${vStart + 3}" v3="${vStart + 7}" />`);
                    triangles.push(`      <triangle v1="${vStart}" v2="${vStart + 7}" v3="${vStart + 4}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${vStart + 1}" v2="${vStart + 5}" v3="${vStart + 6}" />`);
                    triangles.push(`      <triangle v1="${vStart + 1}" v2="${vStart + 6}" v3="${vStart + 2}" />`);
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(`  <object id="${materialIdx + 2}" type="model" materialid="${materialIdx + 1}">
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
        
        vertexOffset += localVertexCount;
    });

    const buildItems = objects.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">Firaga 3D Model</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
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
