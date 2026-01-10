import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDExportSettings {
    format: "3mf" | "openscad-masks";
    pixelHeight: number;
    baseThickness: number;
}

/**
 * Generates a 3MF file containing a triangle mesh with separate material shapes for each color.
 * The 3MF format is an industry-standard XML-based format for 3D printing.
 */
export async function generate3MF(image: PartListImage, settings: ThreeDExportSettings): Promise<Blob> {
    const { pixelHeight, baseThickness } = settings;
    
    // Build the 3D model XML
    const modelXml = build3DModelXml(image, pixelHeight, baseThickness);
    
    // Create a ZIP file with the required 3MF structure
    const zip = await createZipFile([
        { path: "3D/3dmodel.model", content: modelXml },
        { path: "[Content_Types].xml", content: getContentTypesXml() },
        { path: "_rels/.rels", content: getRelsXml() }
    ]);
    
    return zip;
}

function build3DModelXml(image: PartListImage, pixelHeight: number, baseThickness: number): string {
    const { width, height, partList, pixels } = image;
    
    let meshId = 1;
    let vertexOffset = 0;
    const objects: string[] = [];
    const resources: string[] = [];
    
    // Create a separate mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const entry = partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexIdx = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube at position (x, y, 0) with dimensions (1, 1, pixelHeight)
                    const cubeVerts = createCubeVertices(x, y, 0, 1, 1, pixelHeight + baseThickness);
                    const cubeTriangles = createCubeTriangles(localVertexIdx);
                    
                    vertices.push(...cubeVerts);
                    triangles.push(...cubeTriangles);
                    localVertexIdx += 8; // 8 vertices per cube
                }
            }
        }
        
        if (vertices.length > 0) {
            const color = entry.target;
            const hexColor = colorEntryToHex(color).substring(1); // Remove # prefix
            
            resources.push(`    <basematerials id="${meshId}">
      <base name="${escapeXml(color.name)}" displaycolor="#${hexColor}" />
    </basematerials>`);
            
            resources.push(`    <object id="${meshId + 1}" type="model" materialid="${meshId}" materialproperty="0">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
            
            objects.push(`    <item objectid="${meshId + 1}" />`);
            meshId += 2;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${objects.join('\n')}
  </build>
</model>`;
}

function createCubeVertices(x: number, y: number, z: number, w: number, h: number, d: number): string[] {
    return [
        `          <vertex x="${x}" y="${y}" z="${z}" />`,
        `          <vertex x="${x + w}" y="${y}" z="${z}" />`,
        `          <vertex x="${x + w}" y="${y + h}" z="${z}" />`,
        `          <vertex x="${x}" y="${y + h}" z="${z}" />`,
        `          <vertex x="${x}" y="${y}" z="${z + d}" />`,
        `          <vertex x="${x + w}" y="${y}" z="${z + d}" />`,
        `          <vertex x="${x + w}" y="${y + h}" z="${z + d}" />`,
        `          <vertex x="${x}" y="${y + h}" z="${z + d}" />`
    ];
}

function createCubeTriangles(offset: number): string[] {
    return [
        // Bottom face
        `          <triangle v1="${offset + 0}" v2="${offset + 1}" v3="${offset + 2}" />`,
        `          <triangle v1="${offset + 0}" v2="${offset + 2}" v3="${offset + 3}" />`,
        // Top face
        `          <triangle v1="${offset + 4}" v2="${offset + 6}" v3="${offset + 5}" />`,
        `          <triangle v1="${offset + 4}" v2="${offset + 7}" v3="${offset + 6}" />`,
        // Front face
        `          <triangle v1="${offset + 0}" v2="${offset + 5}" v3="${offset + 1}" />`,
        `          <triangle v1="${offset + 0}" v2="${offset + 4}" v3="${offset + 5}" />`,
        // Back face
        `          <triangle v1="${offset + 2}" v2="${offset + 7}" v3="${offset + 3}" />`,
        `          <triangle v1="${offset + 2}" v2="${offset + 6}" v3="${offset + 7}" />`,
        // Left face
        `          <triangle v1="${offset + 0}" v2="${offset + 7}" v3="${offset + 4}" />`,
        `          <triangle v1="${offset + 0}" v2="${offset + 3}" v3="${offset + 7}" />`,
        // Right face
        `          <triangle v1="${offset + 1}" v2="${offset + 5}" v3="${offset + 6}" />`,
        `          <triangle v1="${offset + 1}" v2="${offset + 6}" v3="${offset + 2}" />`
    ];
}

function getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function createZipFile(files: Array<{ path: string; content: string }>): Promise<Blob> {
    // For browser compatibility, we'll use a simple ZIP implementation
    // In a production environment, you might want to use a library like JSZip
    const encoder = new TextEncoder();
    const zipData: number[] = [];
    
    const centralDirectory: number[] = [];
    let offset = 0;
    
    for (const file of files) {
        const content = encoder.encode(file.content);
        const fileName = encoder.encode(file.path);
        
        // Local file header
        const localHeader = [
            0x50, 0x4b, 0x03, 0x04, // Signature
            0x14, 0x00, // Version needed
            0x00, 0x00, // Flags
            0x00, 0x00, // Compression method (stored)
            0x00, 0x00, // Mod time
            0x00, 0x00, // Mod date
            ...uint32ToBytes(crc32(content)), // CRC-32
            ...uint32ToBytes(content.length), // Compressed size
            ...uint32ToBytes(content.length), // Uncompressed size
            ...uint16ToBytes(fileName.length), // File name length
            0x00, 0x00 // Extra field length
        ];
        
        zipData.push(...localHeader);
        zipData.push(...fileName);
        zipData.push(...content);
        
        // Central directory entry
        const centralEntry = [
            0x50, 0x4b, 0x01, 0x02, // Signature
            0x14, 0x00, // Version made by
            0x14, 0x00, // Version needed
            0x00, 0x00, // Flags
            0x00, 0x00, // Compression method
            0x00, 0x00, // Mod time
            0x00, 0x00, // Mod date
            ...uint32ToBytes(crc32(content)), // CRC-32
            ...uint32ToBytes(content.length), // Compressed size
            ...uint32ToBytes(content.length), // Uncompressed size
            ...uint16ToBytes(fileName.length), // File name length
            0x00, 0x00, // Extra field length
            0x00, 0x00, // File comment length
            0x00, 0x00, // Disk number
            0x00, 0x00, // Internal attributes
            0x00, 0x00, 0x00, 0x00, // External attributes
            ...uint32ToBytes(offset) // Relative offset
        ];
        
        centralDirectory.push(...centralEntry);
        centralDirectory.push(...fileName);
        
        offset += localHeader.length + fileName.length + content.length;
    }
    
    const centralDirOffset = offset;
    zipData.push(...centralDirectory);
    
    // End of central directory
    const endOfCentralDir = [
        0x50, 0x4b, 0x05, 0x06, // Signature
        0x00, 0x00, // Disk number
        0x00, 0x00, // Central directory start disk
        ...uint16ToBytes(files.length), // Entries on this disk
        ...uint16ToBytes(files.length), // Total entries
        ...uint32ToBytes(centralDirectory.length), // Central directory size
        ...uint32ToBytes(centralDirOffset), // Central directory offset
        0x00, 0x00 // Comment length
    ];
    
    zipData.push(...endOfCentralDir);
    
    return new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
}

function uint16ToBytes(value: number): number[] {
    return [value & 0xff, (value >> 8) & 0xff];
}

function uint32ToBytes(value: number): number[] {
    return [
        value & 0xff,
        (value >> 8) & 0xff,
        (value >> 16) & 0xff,
        (value >> 24) & 0xff
    ];
}

function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }
    return crc ^ 0xffffffff;
}
