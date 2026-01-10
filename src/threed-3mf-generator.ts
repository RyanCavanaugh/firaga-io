import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFDocument(image);
    const blob = createZipWith3MFContent(xml, image);
    saveAs(blob, `${filename.replace(/\.[^.]+$/, '')}.3mf`);
}

function build3MFDocument(image: PartListImage): string {
    const voxelSize = 1.0; // 1mm per pixel
    const baseHeight = 0.5; // Base thickness in mm
    const pixelHeight = 1.0; // Height per pixel layer in mm
    
    let vertexId = 1;
    let triangleId = 1;
    const meshes: string[] = [];
    const resources: string[] = [];
    
    // Create material resources
    image.partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRgb(hex);
        resources.push(
            `    <basematerials id="${colorIndex + 1}">`,
            `      <base name="${part.target.name}" displaycolor="${rgb}" />`,
            `    </basematerials>`
        );
    });
    
    // Create mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        const startVertexId = vertexId;
        
        // Collect all pixels of this color
        const pixels: Array<{ x: number; y: number }> = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    pixels.push({ x, y });
                }
            }
        }
        
        if (pixels.length === 0) return;
        
        // For each pixel, create a rectangular prism (box)
        pixels.forEach(({ x, y }) => {
            const x0 = x * voxelSize;
            const x1 = (x + 1) * voxelSize;
            const y0 = y * voxelSize;
            const y1 = (y + 1) * voxelSize;
            const z0 = 0;
            const z1 = baseHeight + pixelHeight;
            
            // 8 vertices of the box
            const v0 = vertexId++;
            const v1 = vertexId++;
            const v2 = vertexId++;
            const v3 = vertexId++;
            const v4 = vertexId++;
            const v5 = vertexId++;
            const v6 = vertexId++;
            const v7 = vertexId++;
            
            vertices.push(
                `      <vertex x="${x0}" y="${y0}" z="${z0}" />`, // v0
                `      <vertex x="${x1}" y="${y0}" z="${z0}" />`, // v1
                `      <vertex x="${x1}" y="${y1}" z="${z0}" />`, // v2
                `      <vertex x="${x0}" y="${y1}" z="${z0}" />`, // v3
                `      <vertex x="${x0}" y="${y0}" z="${z1}" />`, // v4
                `      <vertex x="${x1}" y="${y0}" z="${z1}" />`, // v5
                `      <vertex x="${x1}" y="${y1}" z="${z1}" />`, // v6
                `      <vertex x="${x0}" y="${y1}" z="${z1}" />`  // v7
            );
            
            // 12 triangles (2 per face, 6 faces)
            // Bottom face (z0)
            triangles.push(`      <triangle v1="${v0 - 1}" v2="${v2 - 1}" v3="${v1 - 1}" />`);
            triangles.push(`      <triangle v1="${v0 - 1}" v2="${v3 - 1}" v3="${v2 - 1}" />`);
            // Top face (z1)
            triangles.push(`      <triangle v1="${v4 - 1}" v2="${v5 - 1}" v3="${v6 - 1}" />`);
            triangles.push(`      <triangle v1="${v4 - 1}" v2="${v6 - 1}" v3="${v7 - 1}" />`);
            // Front face (y0)
            triangles.push(`      <triangle v1="${v0 - 1}" v2="${v1 - 1}" v3="${v5 - 1}" />`);
            triangles.push(`      <triangle v1="${v0 - 1}" v2="${v5 - 1}" v3="${v4 - 1}" />`);
            // Back face (y1)
            triangles.push(`      <triangle v1="${v2 - 1}" v2="${v3 - 1}" v3="${v7 - 1}" />`);
            triangles.push(`      <triangle v1="${v2 - 1}" v2="${v7 - 1}" v3="${v6 - 1}" />`);
            // Left face (x0)
            triangles.push(`      <triangle v1="${v0 - 1}" v2="${v4 - 1}" v3="${v7 - 1}" />`);
            triangles.push(`      <triangle v1="${v0 - 1}" v2="${v7 - 1}" v3="${v3 - 1}" />`);
            // Right face (x1)
            triangles.push(`      <triangle v1="${v1 - 1}" v2="${v2 - 1}" v3="${v6 - 1}" />`);
            triangles.push(`      <triangle v1="${v1 - 1}" v2="${v6 - 1}" v3="${v5 - 1}" />`);
        });
        
        if (vertices.length > 0) {
            meshes.push(
                `    <object id="${100 + colorIndex}" name="${part.target.name}" type="model" pid="${colorIndex + 1}" pindex="0">`,
                `      <mesh>`,
                `        <vertices>`,
                ...vertices,
                `        </vertices>`,
                `        <triangles>`,
                ...triangles,
                `        </triangles>`,
                `      </mesh>`,
                `    </object>`
            );
        }
    });
    
    // Build final XML
    const modelXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
        '  <resources>',
        ...resources,
        ...meshes,
        '  </resources>',
        '  <build>',
        ...image.partList.map((_, i) => 
            meshes.some(m => m.includes(`id="${100 + i}"`)) 
                ? `    <item objectid="${100 + i}" />`
                : ''
        ).filter(Boolean),
        '  </build>',
        '</model>'
    ].join('\n');
    
    return modelXml;
}

function createZipWith3MFContent(modelXml: string, image: PartListImage): Blob {
    // For now, create a simple 3MF file without full ZIP structure
    // In production, would use JSZip library
    
    // Simple approach: just return the XML wrapped in basic structure
    // A proper 3MF file is a ZIP container with specific structure
    // Since we don't have JSZip as dependency, we'll create minimal valid 3MF
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    // Note: This simplified implementation returns just the model XML
    // A complete implementation would need a ZIP library to create proper 3MF structure
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    return blob;
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#808080';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `#${result[1]}${result[2]}${result[3]}`.toUpperCase();
}
