import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

/**
 * Generates a 3MF file (3D Manufacturing Format) with separate material shapes for each color
 */
export async function generate3MF(image: PartListImage, filename: string): Promise<void> {
    const modelXml = generateModelXML(image);
    const relsXml = generateRelsXML();
    const contentTypesXml = generateContentTypesXML();
    
    // Create a zip file using JSZip-like structure with Blob
    const zip = await createZipStructure({
        '3D/3dmodel.model': modelXml,
        '_rels/.rels': relsXml,
        '[Content_Types].xml': contentTypesXml
    });
    
    saveAs(zip, `${filename}.3mf`);
}

function generateModelXML(image: PartListImage): string {
    const voxelSize = 1.0; // 1mm per pixel
    const height = 2.0; // 2mm height for each colored voxel
    
    let objectsXml = '';
    let resourcesXml = '';
    let buildItemsXml = '';
    
    // Generate base colors as materials
    let materialId = 1;
    const colorToMaterialId = new Map<number, number>();
    
    for (const part of image.partList) {
        const hexColor = colorEntryToHex(part.target);
        const rgb = hexToRgb(hexColor);
        resourcesXml += `    <basematerials id="${materialId}">
      <base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />
    </basematerials>\n`;
        colorToMaterialId.set(image.partList.indexOf(part), materialId);
        materialId++;
    }
    
    // Generate mesh for each color
    let objectId = 1;
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    const baseVertexIndex = vertices.length;
                    const x0 = x * voxelSize;
                    const x1 = (x + 1) * voxelSize;
                    const y0 = y * voxelSize;
                    const y1 = (y + 1) * voxelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // Add 8 vertices for the box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    const v = baseVertexIndex;
                    // Bottom face
                    triangles.push([v, v + 2, v + 1], [v, v + 3, v + 2]);
                    // Top face
                    triangles.push([v + 4, v + 5, v + 6], [v + 4, v + 6, v + 7]);
                    // Front face
                    triangles.push([v, v + 1, v + 5], [v, v + 5, v + 4]);
                    // Back face
                    triangles.push([v + 2, v + 3, v + 7], [v + 2, v + 7, v + 6]);
                    // Left face
                    triangles.push([v, v + 4, v + 7], [v, v + 7, v + 3]);
                    // Right face
                    triangles.push([v + 1, v + 2, v + 6], [v + 1, v + 6, v + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            const matId = colorToMaterialId.get(partIdx);
            let meshXml = `    <object id="${objectId}" type="model" pid="${matId}" pindex="0">
      <mesh>
        <vertices>\n`;
            
            for (const [x, y, z] of vertices) {
                meshXml += `          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
            }
            
            meshXml += `        </vertices>
        <triangles>\n`;
            
            for (const [v1, v2, v3] of triangles) {
                meshXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
            }
            
            meshXml += `        </triangles>
      </mesh>
    </object>\n`;
            
            objectsXml += meshXml;
            buildItemsXml += `    <item objectid="${objectId}" />\n`;
            objectId++;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resourcesXml}${objectsXml}  </resources>
  <build>
${buildItemsXml}  </build>
</model>`;
}

function generateRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function generateContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

async function createZipStructure(files: Record<string, string>): Promise<Blob> {
    // Simple zip file creation without external library
    // For production, use JSZip library
    // This is a minimal implementation
    
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;
    
    for (const [path, content] of Object.entries(files)) {
        const data = encoder.encode(content);
        const pathBytes = encoder.encode(path);
        
        // Local file header
        const header = new Uint8Array(30 + pathBytes.length);
        const view = new DataView(header.buffer);
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed to extract
        view.setUint16(6, 0, true); // General purpose bit flag
        view.setUint16(8, 0, true); // Compression method (0 = no compression)
        view.setUint16(10, 0, true); // Last mod file time
        view.setUint16(12, 0, true); // Last mod file date
        view.setUint32(14, crc32(data), true); // CRC-32
        view.setUint32(18, data.length, true); // Compressed size
        view.setUint32(22, data.length, true); // Uncompressed size
        view.setUint16(26, pathBytes.length, true); // File name length
        view.setUint16(28, 0, true); // Extra field length
        header.set(pathBytes, 30);
        
        chunks.push(header);
        chunks.push(data);
        
        // Central directory header
        const cdHeader = new Uint8Array(46 + pathBytes.length);
        const cdView = new DataView(cdHeader.buffer);
        cdView.setUint32(0, 0x02014b50, true); // Central directory signature
        cdView.setUint16(4, 20, true); // Version made by
        cdView.setUint16(6, 20, true); // Version needed to extract
        cdView.setUint16(8, 0, true); // General purpose bit flag
        cdView.setUint16(10, 0, true); // Compression method
        cdView.setUint16(12, 0, true); // Last mod file time
        cdView.setUint16(14, 0, true); // Last mod file date
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
        cdHeader.set(pathBytes, 46);
        
        centralDirectory.push(cdHeader);
        offset += header.length + data.length;
    }
    
    const cdData = new Uint8Array(centralDirectory.reduce((sum, cd) => sum + cd.length, 0));
    let cdOffset = 0;
    for (const cd of centralDirectory) {
        cdData.set(cd, cdOffset);
        cdOffset += cd.length;
    }
    
    // End of central directory record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk where central directory starts
    eocdView.setUint16(8, centralDirectory.length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, centralDirectory.length, true); // Total number of central directory records
    eocdView.setUint32(12, cdData.length, true); // Size of central directory
    eocdView.setUint32(16, offset, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // Comment length
    
    const allChunks = [...chunks, cdData, eocd];
    const totalLength = allChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of allChunks) {
        result.set(chunk, position);
        position += chunk.length;
    }
    
    return new Blob([result], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel' });
}

function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#FFFFFF';
    return `#${result[1]}${result[2]}${result[3]}`.toUpperCase();
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
