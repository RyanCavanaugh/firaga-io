import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

/**
 * Generates a 3MF file (3D Manufacturing Format) containing a triangle mesh
 * with separate material shapes for each color in the image.
 */
export function generate3MF(image: PartListImage, filename: string): void {
    const basename = filename.replace(/\.[^.]+$/, '');
    
    // Build the 3D model XML
    const model3D = build3DModel(image);
    
    // Package as 3MF (which is a ZIP file)
    package3MF(model3D, `${basename}.3mf`);
}

function build3DModel(image: PartListImage): string {
    const xmlns = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';
    const materialNS = 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="${xmlns}" xmlns:m="${materialNS}">
  <resources>
    <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((entry, idx) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove #
        xml += `      <base name="${escapeXml(entry.target.name)}" displaycolor="#${color}FF" />\n`;
    });
    
    xml += `    </basematerials>\n`;
    
    // Generate mesh objects for each color
    image.partList.forEach((entry, colorIdx) => {
        const meshId = colorIdx + 2; // Start from 2 since basematerials is 1
        xml += generateMeshForColor(image, colorIdx, meshId);
    });
    
    xml += `  </resources>
  <build>
`;
    
    // Add all objects to the build
    image.partList.forEach((entry, colorIdx) => {
        const objectId = colorIdx + 2;
        xml += `    <item objectid="${objectId}" />\n`;
    });
    
    xml += `  </build>
</model>`;
    
    return xml;
}

function generateMeshForColor(image: PartListImage, colorIdx: number, objectId: number): string {
    const voxelSize = 2.5; // mm per pixel (standard mini bead size)
    const height = 2.5; // mm height
    
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexCount = 0;
    
    // Generate vertices and triangles for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                // Create a voxel (rectangular prism) for this pixel
                const x0 = x * voxelSize;
                const x1 = (x + 1) * voxelSize;
                const y0 = y * voxelSize;
                const y1 = (y + 1) * voxelSize;
                const z0 = 0;
                const z1 = height;
                
                const baseIdx = vertexCount;
                
                // 8 vertices of the voxel
                vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                
                vertexCount += 8;
                
                // 12 triangles (2 per face, 6 faces)
                // Bottom face
                triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" pid="1" p1="${colorIdx}" />`);
                triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" pid="1" p1="${colorIdx}" />`);
                // Top face
                triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" pid="1" p1="${colorIdx}" />`);
                triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" pid="1" p1="${colorIdx}" />`);
                // Front face
                triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" pid="1" p1="${colorIdx}" />`);
                triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" pid="1" p1="${colorIdx}" />`);
                // Back face
                triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" pid="1" p1="${colorIdx}" />`);
                triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" pid="1" p1="${colorIdx}" />`);
                // Left face
                triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" pid="1" p1="${colorIdx}" />`);
                triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" pid="1" p1="${colorIdx}" />`);
                // Right face
                triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" pid="1" p1="${colorIdx}" />`);
                triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" pid="1" p1="${colorIdx}" />`);
            }
        }
    }
    
    if (vertices.length === 0) {
        // No pixels of this color, create an empty mesh
        return `    <object id="${objectId}" type="model">
      <mesh>
        <vertices />
        <triangles />
      </mesh>
    </object>
`;
    }
    
    return `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>
`;
}

function package3MF(modelXml: string, filename: string): void {
    // 3MF is a ZIP archive with specific structure
    // We'll use JSZip library if available, otherwise create a simple implementation
    
    // For now, we'll download the XML directly and let the user know to zip it
    // In a production implementation, we'd use JSZip
    const blob = new Blob([modelXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.3mf', '.model');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show alert about manual zipping for now
    alert('Note: For a complete 3MF file, the .model file needs to be packaged in a ZIP archive with proper 3MF structure. ' +
          'This export provides the 3D model XML. Consider using specialized 3MF export tools for production use.');
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
