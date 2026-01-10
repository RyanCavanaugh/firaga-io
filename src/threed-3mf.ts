import { PartListImage } from './image-utils';

/**
 * Generates a 3MF (3D Manufacturing Format) file containing a triangle mesh
 * with separate material shapes for each color in the image.
 */
export async function generate3MF(image: PartListImage, filename: string) {
    const { saveAs } = await import('file-saver');
    
    // Build the 3MF XML structure
    const meshes: string[] = [];
    const resources: string[] = [];
    const build: string[] = [];
    
    let resourceId = 1;
    const baseHeight = 0.5; // Base thickness for the board
    const pixelHeight = 0.3; // Height per color layer
    
    // Create a material for each color
    image.partList.forEach((part, index) => {
        const materialId = resourceId++;
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        resources.push(`    <basematerials id="${materialId}">
      <base name="${escapeXml(color.name)}" displaycolor="#${rgbToHex(color.r, color.g, color.b)}" />
    </basematerials>`);
        
        // Create mesh for this color
        const meshId = resourceId++;
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Build geometry for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === index) {
                    // Create a small cube for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices of the cube
                    const baseVertex = vertexIndex;
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
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
                    triangles.push(`        <triangle v1="${baseVertex + 2}" v2="${baseVertex + 3}" v3="${baseVertex + 7}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    // Left face
                    triangles.push(`        <triangle v1="${baseVertex + 3}" v2="${baseVertex + 0}" v3="${baseVertex + 4}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    // Right face
                    triangles.push(`        <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            resources.push(`    <object id="${meshId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
            
            build.push(`    <item objectid="${meshId}" />`)
        }
    });
    
    // Create the complete 3MF XML
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${build.join('\n')}
  </build>
</model>`;
    
    // 3MF files are ZIP archives with specific structure
    // For simplicity, we'll create a single XML file
    // A proper implementation would use JSZip to create the archive
    
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    const cleanFilename = filename.replace(/\.[^.]*$/, '');
    saveAs(blob, `${cleanFilename}.model`);
    
    console.log('Note: This generates a .model XML file. For full 3MF support, a ZIP library would be needed.');
}

function escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
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

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}
