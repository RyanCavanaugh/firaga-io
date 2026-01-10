import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface Export3MFSettings {
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
}

/**
 * Exports a PartListImage to 3MF format (3D Manufacturing Format)
 * Creates separate material shapes for each color
 */
export function export3MF(image: PartListImage, settings: Export3MFSettings): Blob {
    const { pixelWidth, pixelHeight, pixelDepth } = settings;
    
    // Build the 3D model XML
    const modelXml = build3DModel(image, pixelWidth, pixelHeight, pixelDepth);
    
    // Build content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    // Build relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0"/>
</Relationships>`;
    
    // Create ZIP structure as 3MF
    return create3MFZip(contentTypes, rels, modelXml);
}

function build3DModel(image: PartListImage, pixelWidth: number, pixelHeight: number, pixelDepth: number): string {
    const meshes: string[] = [];
    const resources: string[] = [];
    
    // Create a mesh for each color
    image.partList.forEach((part, colorIdx) => {
        if (part.count === 0) return;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        const colorHex = colorEntryToHex(part.target).substring(1); // Remove #
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Add a cube for this pixel
                    const cubeData = createCube(x * pixelWidth, y * pixelHeight, 0, pixelWidth, pixelHeight, pixelDepth);
                    
                    // Add vertices with offset
                    cubeData.vertices.forEach(v => {
                        vertices.push(`    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`);
                    });
                    
                    // Add triangles with vertex offset
                    cubeData.triangles.forEach(t => {
                        const v1 = t[0] + vertexCount;
                        const v2 = t[1] + vertexCount;
                        const v3 = t[2] + vertexCount;
                        triangles.push(`    <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`);
                    });
                    
                    vertexCount += cubeData.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = `mesh${colorIdx}`;
            const mesh = `  <object id="${colorIdx + 1}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`;
            
            resources.push(mesh);
            meshes.push(`    <item objectid="${colorIdx + 1}"/>`);
        }
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${meshes.join('\n')}
  </build>
</model>`;
}

function createCube(x: number, y: number, z: number, width: number, height: number, depth: number): {
    vertices: Array<[number, number, number]>;
    triangles: Array<[number, number, number]>;
} {
    const vertices: Array<[number, number, number]> = [
        [x, y, z],             // 0: bottom-front-left
        [x + width, y, z],     // 1: bottom-front-right
        [x + width, y + height, z], // 2: bottom-back-right
        [x, y + height, z],    // 3: bottom-back-left
        [x, y, z + depth],     // 4: top-front-left
        [x + width, y, z + depth], // 5: top-front-right
        [x + width, y + height, z + depth], // 6: top-back-right
        [x, y + height, z + depth]  // 7: top-back-left
    ];
    
    // 12 triangles (2 per face, 6 faces)
    const triangles: Array<[number, number, number]> = [
        // Bottom face (z=0)
        [0, 1, 2], [0, 2, 3],
        // Top face (z=depth)
        [4, 6, 5], [4, 7, 6],
        // Front face (y=0)
        [0, 4, 5], [0, 5, 1],
        // Back face (y=height)
        [3, 2, 6], [3, 6, 7],
        // Left face (x=0)
        [0, 3, 7], [0, 7, 4],
        // Right face (x=width)
        [1, 5, 6], [1, 6, 2]
    ];
    
    return { vertices, triangles };
}

function create3MFZip(contentTypes: string, rels: string, modelXml: string): Blob {
    // Simple ZIP file creation for 3MF
    // A proper implementation would use a ZIP library, but for basic functionality
    // we'll create the structure manually
    
    // For now, return a blob with the model XML
    // In production, this should create a proper ZIP archive
    const encoder = new TextEncoder();
    
    // Create a simple ZIP structure
    const files = [
        { name: '[Content_Types].xml', content: contentTypes },
        { name: '_rels/.rels', content: rels },
        { name: '3D/3dmodel.model', content: modelXml }
    ];
    
    // This is a simplified approach - in production use JSZip or similar
    const zipData = createSimpleZip(files);
    
    return new Blob([zipData], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function createSimpleZip(files: Array<{ name: string; content: string }>): Uint8Array {
    // Simplified ZIP creation - this is a placeholder
    // In production, use a proper ZIP library like JSZip
    
    const encoder = new TextEncoder();
    const entries: Uint8Array[] = [];
    let offset = 0;
    const centralDirectory: Uint8Array[] = [];
    
    files.forEach((file, index) => {
        const nameBytes = encoder.encode(file.name);
        const contentBytes = encoder.encode(file.content);
        
        // Local file header
        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);
        
        // Local file header signature
        view.setUint32(0, 0x04034b50, true);
        // Version needed to extract
        view.setUint16(4, 20, true);
        // General purpose bit flag
        view.setUint16(6, 0, true);
        // Compression method (0 = stored)
        view.setUint16(8, 0, true);
        // File modification time
        view.setUint16(10, 0, true);
        // File modification date
        view.setUint16(12, 0, true);
        // CRC-32
        view.setUint32(14, crc32(contentBytes), true);
        // Compressed size
        view.setUint32(18, contentBytes.length, true);
        // Uncompressed size
        view.setUint32(22, contentBytes.length, true);
        // File name length
        view.setUint16(26, nameBytes.length, true);
        // Extra field length
        view.setUint16(28, 0, true);
        
        // File name
        header.set(nameBytes, 30);
        
        entries.push(header);
        entries.push(contentBytes);
        
        // Central directory header
        const cdHeader = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(cdHeader.buffer);
        
        // Central directory file header signature
        cdView.setUint32(0, 0x02014b50, true);
        // Version made by
        cdView.setUint16(4, 20, true);
        // Version needed to extract
        cdView.setUint16(6, 20, true);
        // General purpose bit flag
        cdView.setUint16(8, 0, true);
        // Compression method
        cdView.setUint16(10, 0, true);
        // File modification time
        cdView.setUint16(12, 0, true);
        // File modification date
        cdView.setUint16(14, 0, true);
        // CRC-32
        cdView.setUint32(16, crc32(contentBytes), true);
        // Compressed size
        cdView.setUint32(20, contentBytes.length, true);
        // Uncompressed size
        cdView.setUint32(24, contentBytes.length, true);
        // File name length
        cdView.setUint16(28, nameBytes.length, true);
        // Extra field length
        cdView.setUint16(30, 0, true);
        // File comment length
        cdView.setUint16(32, 0, true);
        // Disk number start
        cdView.setUint16(34, 0, true);
        // Internal file attributes
        cdView.setUint16(36, 0, true);
        // External file attributes
        cdView.setUint32(38, 0, true);
        // Relative offset of local header
        cdView.setUint32(42, offset, true);
        
        // File name
        cdHeader.set(nameBytes, 46);
        
        centralDirectory.push(cdHeader);
        
        offset += header.length + contentBytes.length;
    });
    
    const cdSize = centralDirectory.reduce((sum, arr) => sum + arr.length, 0);
    
    // End of central directory record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    
    // End of central directory signature
    eocdView.setUint32(0, 0x06054b50, true);
    // Number of this disk
    eocdView.setUint16(4, 0, true);
    // Disk where central directory starts
    eocdView.setUint16(6, 0, true);
    // Number of central directory records on this disk
    eocdView.setUint16(8, files.length, true);
    // Total number of central directory records
    eocdView.setUint16(10, files.length, true);
    // Size of central directory
    eocdView.setUint32(12, cdSize, true);
    // Offset of start of central directory
    eocdView.setUint32(16, offset, true);
    // Comment length
    eocdView.setUint16(20, 0, true);
    
    // Combine all parts
    const totalSize = offset + cdSize + eocd.length;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    
    entries.forEach(entry => {
        result.set(entry, pos);
        pos += entry.length;
    });
    
    centralDirectory.forEach(cd => {
        result.set(cd, pos);
        pos += cd.length;
    });
    
    result.set(eocd, pos);
    
    return result;
}

function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }
    
    return ~crc >>> 0;
}
