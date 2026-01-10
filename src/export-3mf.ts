import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3MFSettings = {
    pixelWidth: number;
    pixelHeight: number;
    baseThickness: number;
};

export function generate3MF(image: PartListImage, settings: Export3MFSettings): Blob {
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    
    // Build materials section
    const materials = image.partList.map((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        return `    <base:material id="${idx + 1}" name="${escapeXml(part.target.name)}" color="#${hex}FF" />`;
    }).join('\n');

    // Build mesh objects for each color
    const objects = image.partList.map((part, idx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = baseThickness;

                    const baseIdx = vertexCount;
                    
                    // 8 vertices of the cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length === 0) {
            return ''; // Skip empty colors
        }

        return `  <object id="${idx + 2}" name="${escapeXml(part.target.name)}" materialid="${idx + 1}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`;
    }).filter(obj => obj !== '').join('\n');

    const buildItems = image.partList
        .map((_, idx) => `    <item objectid="${idx + 2}" />`)
        .join('\n');

    const model3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${materials}
    </basematerials>
${objects}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;

    // Create a simple ZIP structure for 3MF
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    return create3MFZip(model3mf, rels, contentTypes);
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function create3MFZip(model: string, rels: string, contentTypes: string): Blob {
    // Simple ZIP creation using browser APIs
    // For a production implementation, consider using JSZip library
    // This is a minimal implementation
    
    const encoder = new TextEncoder();
    const files = [
        { name: '[Content_Types].xml', data: encoder.encode(contentTypes) },
        { name: '_rels/.rels', data: encoder.encode(rels) },
        { name: '3D/3dmodel.model', data: encoder.encode(model) }
    ];

    // Create a simple ZIP structure
    const zipParts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    files.forEach(file => {
        const { localHeader, centralHeader, compressedData } = createZipEntry(file.name, file.data, offset);
        zipParts.push(localHeader, compressedData);
        centralDirectory.push(centralHeader);
        offset += localHeader.length + compressedData.length;
    });

    const endOfCentral = createEndOfCentralDirectory(files.length, centralDirectory, offset);
    
    return new Blob([...zipParts, ...centralDirectory, endOfCentral], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function createZipEntry(filename: string, data: Uint8Array, offset: number) {
    const filenameBytes = new TextEncoder().encode(filename);
    const crc = crc32(data);
    
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(localHeader.buffer);
    
    // Local file header signature
    view.setUint32(0, 0x04034b50, true);
    // Version needed to extract
    view.setUint16(4, 20, true);
    // General purpose bit flag
    view.setUint16(6, 0, true);
    // Compression method (0 = no compression)
    view.setUint16(8, 0, true);
    // File last modification time
    view.setUint16(10, 0, true);
    // File last modification date
    view.setUint16(12, 0, true);
    // CRC-32
    view.setUint32(14, crc, true);
    // Compressed size
    view.setUint32(18, data.length, true);
    // Uncompressed size
    view.setUint32(22, data.length, true);
    // File name length
    view.setUint16(26, filenameBytes.length, true);
    // Extra field length
    view.setUint16(28, 0, true);
    // File name
    localHeader.set(filenameBytes, 30);
    
    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    
    // Central directory file header signature
    centralView.setUint32(0, 0x02014b50, true);
    // Version made by
    centralView.setUint16(4, 20, true);
    // Version needed to extract
    centralView.setUint16(6, 20, true);
    // General purpose bit flag
    centralView.setUint16(8, 0, true);
    // Compression method
    centralView.setUint16(10, 0, true);
    // File last modification time
    centralView.setUint16(12, 0, true);
    // File last modification date
    centralView.setUint16(14, 0, true);
    // CRC-32
    centralView.setUint32(16, crc, true);
    // Compressed size
    centralView.setUint32(20, data.length, true);
    // Uncompressed size
    centralView.setUint32(24, data.length, true);
    // File name length
    centralView.setUint16(28, filenameBytes.length, true);
    // Extra field length
    centralView.setUint16(30, 0, true);
    // File comment length
    centralView.setUint16(32, 0, true);
    // Disk number start
    centralView.setUint16(34, 0, true);
    // Internal file attributes
    centralView.setUint16(36, 0, true);
    // External file attributes
    centralView.setUint32(38, 0, true);
    // Relative offset of local header
    centralView.setUint32(42, offset, true);
    // File name
    centralHeader.set(filenameBytes, 46);
    
    return { localHeader, centralHeader, compressedData: data };
}

function createEndOfCentralDirectory(fileCount: number, centralDirectory: Uint8Array[], centralDirOffset: number): Uint8Array {
    const centralDirSize = centralDirectory.reduce((sum, arr) => sum + arr.length, 0);
    const end = new Uint8Array(22);
    const view = new DataView(end.buffer);
    
    // End of central directory signature
    view.setUint32(0, 0x06054b50, true);
    // Number of this disk
    view.setUint16(4, 0, true);
    // Disk where central directory starts
    view.setUint16(6, 0, true);
    // Number of central directory records on this disk
    view.setUint16(8, fileCount, true);
    // Total number of central directory records
    view.setUint16(10, fileCount, true);
    // Size of central directory
    view.setUint32(12, centralDirSize, true);
    // Offset of start of central directory
    view.setUint32(16, centralDirOffset, true);
    // Comment length
    view.setUint16(20, 0, true);
    
    return end;
}

function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c;
}
