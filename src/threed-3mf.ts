import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

/**
 * Generate and download a 3MF file containing a triangle mesh
 * with separate material shapes for each color.
 */
export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage): string {
    const { width, height, pixels, partList } = image;
    
    // Build materials for each color
    const materialsXml: string[] = [];
    const objectsXml: string[] = [];
    
    partList.forEach((entry, colorIndex) => {
        const hex = colorEntryToHex(entry.target);
        const rgb = hexToRgb(hex);
        
        // Add material definition
        materialsXml.push(
            `    <basematerials:displaycolor name="${entry.target.name}" displaycolor="#${rgb}" />`
        );
        
        // Build mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Create a heightmap-style mesh where each pixel becomes a vertical block
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a 1x1x1 cube at position (x, y, 0)
                    const baseIndex = vertexIndex;
                    
                    // 8 vertices for a cube
                    vertices.push(`      <vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y}" z="1" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="1" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="1" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="1" />`);
                    
                    // 12 triangles for a cube (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`      <triangle v1="${baseIndex}" v2="${baseIndex + 2}" v3="${baseIndex + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIndex}" v2="${baseIndex + 3}" v3="${baseIndex + 2}" />`);
                    // Top face (z=1)
                    triangles.push(`      <triangle v1="${baseIndex + 4}" v2="${baseIndex + 5}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 4}" v2="${baseIndex + 6}" v3="${baseIndex + 7}" />`);
                    // Front face (y=min)
                    triangles.push(`      <triangle v1="${baseIndex}" v2="${baseIndex + 1}" v3="${baseIndex + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIndex}" v2="${baseIndex + 5}" v3="${baseIndex + 4}" />`);
                    // Back face (y=max)
                    triangles.push(`      <triangle v1="${baseIndex + 2}" v2="${baseIndex + 3}" v3="${baseIndex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 2}" v2="${baseIndex + 7}" v3="${baseIndex + 6}" />`);
                    // Left face (x=min)
                    triangles.push(`      <triangle v1="${baseIndex}" v2="${baseIndex + 4}" v3="${baseIndex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIndex}" v2="${baseIndex + 7}" v3="${baseIndex + 3}" />`);
                    // Right face (x=max)
                    triangles.push(`      <triangle v1="${baseIndex + 1}" v2="${baseIndex + 2}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 1}" v2="${baseIndex + 6}" v3="${baseIndex + 5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        // Only add object if this color has pixels
        if (vertices.length > 0) {
            objectsXml.push(`  <object id="${colorIndex + 1}" type="model" materialid="${colorIndex}">
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
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="0">
${materialsXml.join('\n')}
    </basematerials:basematerials>
${objectsXml.join('\n')}
  </resources>
  <build>
${objectsXml.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;
    
    return xml;
}

function hexToRgb(hex: string): string {
    // Remove # if present
    const cleaned = hex.replace('#', '');
    return cleaned.toUpperCase();
}
