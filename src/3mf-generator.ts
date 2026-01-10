import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export function generate3MF(image: PartListImage, filename: string) {
    const modelXml = generate3MFModel(image);
    const contentTypesXml = generateContentTypes();
    const relsXml = generateRels();
    
    // Create a zip file structure for 3MF
    const zip = createZipFile([
        { path: '[Content_Types].xml', content: contentTypesXml },
        { path: '_rels/.rels', content: relsXml },
        { path: '3D/3dmodel.model', content: modelXml }
    ]);
    
    const blob = new Blob([zip], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MFModel(image: PartListImage): string {
    const height = 2; // Height of each pixel in mm
    const pixelSize = 1; // Size of each pixel in mm
    
    let vertices = '';
    let triangles = '';
    let vertexCount = 0;
    let triangleCount = 0;
    
    const materials = image.partList.map((entry, idx) => {
        const r = entry.target.r;
        const g = entry.target.g;
        const b = entry.target.b;
        return `    <base:material name="${entry.target.name}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />`;
    }).join('\n');
    
    // Generate a mesh for each color
    const objects = image.partList.map((entry, colorIdx) => {
        let colorVertices = '';
        let colorTriangles = '';
        let colorVertexCount = 0;
        
        // Find all pixels of this color and generate boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices for the box
                    const v0 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x0}" y="${y0}" z="${z0}" />\n`;
                    const v1 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x1}" y="${y0}" z="${z0}" />\n`;
                    const v2 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x1}" y="${y1}" z="${z0}" />\n`;
                    const v3 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x0}" y="${y1}" z="${z0}" />\n`;
                    const v4 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x0}" y="${y0}" z="${z1}" />\n`;
                    const v5 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x1}" y="${y0}" z="${z1}" />\n`;
                    const v6 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x1}" y="${y1}" z="${z1}" />\n`;
                    const v7 = colorVertexCount++;
                    colorVertices += `      <vertex x="${x0}" y="${y1}" z="${z1}" />\n`;
                    
                    // 12 triangles for the box (2 per face)
                    // Bottom face
                    colorTriangles += `      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />\n`;
                    colorTriangles += `      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />\n`;
                    // Top face
                    colorTriangles += `      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />\n`;
                    colorTriangles += `      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />\n`;
                    // Front face
                    colorTriangles += `      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />\n`;
                    colorTriangles += `      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />\n`;
                    // Back face
                    colorTriangles += `      <triangle v1="${v3}" v2="${v7}" v3="${v6}" />\n`;
                    colorTriangles += `      <triangle v1="${v3}" v2="${v6}" v3="${v2}" />\n`;
                    // Left face
                    colorTriangles += `      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />\n`;
                    colorTriangles += `      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />\n`;
                    // Right face
                    colorTriangles += `      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />\n`;
                    colorTriangles += `      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />\n`;
                }
            }
        }
        
        if (colorVertexCount === 0) return '';
        
        return `  <object id="${colorIdx + 2}" type="model" pid="1" pindex="${colorIdx}">
    <mesh>
      <vertices>
${colorVertices}      </vertices>
      <triangles>
${colorTriangles}      </triangles>
    </mesh>
  </object>`;
    }).filter(s => s).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${filename}</metadata>
  <resources>
    <basematerials id="1">
${materials}
    </basematerials>
${objects}
    <object id="1" type="model">
      <components>
${image.partList.map((_, idx) => `        <component objectid="${idx + 2}" />`).filter((_, idx) => image.partList[idx].count > 0).join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

// Simple zip file generator
function createZipFile(files: Array<{ path: string, content: string }>): Uint8Array {
    // For a proper implementation, we'd use JSZip or similar
    // This is a minimal implementation for 3MF
    const encoder = new TextEncoder();
    
    // For now, we'll create a simple structure
    // In production, you'd want to use a proper zip library
    const parts: Uint8Array[] = [];
    let centralDir: Uint8Array[] = [];
    let offset = 0;
    
    for (const file of files) {
        const data = encoder.encode(file.content);
        const pathBytes = encoder.encode(file.path);
        
        // Local file header
        const header = new Uint8Array(30 + pathBytes.length);
        const view = new DataView(header.buffer);
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed to extract
        view.setUint16(6, 0, true); // General purpose bit flag
        view.setUint16(8, 0, true); // Compression method (0 = no compression)
        view.setUint16(10, 0, true); // File last modification time
        view.setUint16(12, 0, true); // File last modification date
        view.setUint32(14, crc32(data), true); // CRC-32
        view.setUint32(18, data.length, true); // Compressed size
        view.setUint32(22, data.length, true); // Uncompressed size
        view.setUint16(26, pathBytes.length, true); // File name length
        view.setUint16(28, 0, true); // Extra field length
        header.set(pathBytes, 30);
        
        parts.push(header);
        parts.push(data);
        
        // Central directory entry
        const cdEntry = new Uint8Array(46 + pathBytes.length);
        const cdView = new DataView(cdEntry.buffer);
        cdView.setUint32(0, 0x02014b50, true); // Central directory header signature
        cdView.setUint16(4, 20, true); // Version made by
        cdView.setUint16(6, 20, true); // Version needed to extract
        cdView.setUint16(8, 0, true); // General purpose bit flag
        cdView.setUint16(10, 0, true); // Compression method
        cdView.setUint16(12, 0, true); // File last modification time
        cdView.setUint16(14, 0, true); // File last modification date
        cdView.setUint32(16, crc32(data), true); // CRC-32
        cdView.setUint32(20, data.length, true); // Compressed size
        cdView.setUint32(24, data.length, true); // Uncompressed size
        cdView.setUint16(28, pathBytes.length, true); // File name length
        cdView.setUint16(30, 0, true); // Extra field length
        cdView.setUint16(32, 0, true); // File comment length
        cdView.setUint16(34, 0, true); // Disk number start
        cdView.setUint16(36, 0, true); // Internal file attributes
        cdView.setUint32(38, 0, true); // External file attributes
        cdView.setUint32(42, offset, true); // Relative offset of local header
        cdEntry.set(pathBytes, 46);
        
        centralDir.push(cdEntry);
        offset += header.length + data.length;
    }
    
    // End of central directory
    const cdSize = centralDir.reduce((sum, entry) => sum + entry.length, 0);
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
    eocdView.setUint16(4, 0, true); // Disk number
    eocdView.setUint16(6, 0, true); // Disk number where central directory starts
    eocdView.setUint16(8, files.length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, files.length, true); // Total number of central directory records
    eocdView.setUint32(12, cdSize, true); // Size of central directory
    eocdView.setUint32(16, offset, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // Comment length
    
    // Combine all parts
    const totalSize = parts.reduce((sum, p) => sum + p.length, 0) + cdSize + eocd.length;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    for (const part of parts) {
        result.set(part, pos);
        pos += part.length;
    }
    for (const entry of centralDir) {
        result.set(entry, pos);
        pos += entry.length;
    }
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
