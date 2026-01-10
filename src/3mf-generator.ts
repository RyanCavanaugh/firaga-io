import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeMFSettings {
    pixelWidth: number;
    pixelHeight: number;
    pixelDepth: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeMFSettings): Blob {
    const materials: string[] = [];
    const meshes: string[] = [];
    
    // Build materials list
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).slice(1); // Remove '#'
        materials.push(`    <basematerials:base name="${escapeXml(color.name)}" displaycolor="#${hex}" />`);
    }
    
    // Build mesh objects - one per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        const vertexMap = new Map<string, number>();
        
        let nextVertexId = 0;
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    addCube(x, y, vertices, triangles, vertexMap);
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = colorIdx + 2; // IDs start at 2 (1 is reserved)
            meshes.push(generateMeshXml(meshId, vertices, triangles));
        }
        
        function addCube(x: number, y: number, verts: string[], tris: string[], vMap: Map<string, number>): void {
            const x0 = x * settings.pixelWidth;
            const x1 = (x + 1) * settings.pixelWidth;
            const y0 = y * settings.pixelHeight;
            const y1 = (y + 1) * settings.pixelHeight;
            const z0 = 0;
            const z1 = settings.pixelDepth;
            
            // 8 vertices of a cube
            const cubeVerts = [
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // Bottom face
                [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // Top face
            ];
            
            const vidx: number[] = [];
            for (const v of cubeVerts) {
                const key = `${v[0]},${v[1]},${v[2]}`;
                let idx = vMap.get(key);
                if (idx === undefined) {
                    idx = nextVertexId++;
                    vMap.set(key, idx);
                    verts.push(`      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
                }
                vidx.push(idx);
            }
            
            // 12 triangles (2 per face, 6 faces)
            const faces = [
                [vidx[0], vidx[1], vidx[2]], [vidx[0], vidx[2], vidx[3]], // Bottom
                [vidx[4], vidx[6], vidx[5]], [vidx[4], vidx[7], vidx[6]], // Top
                [vidx[0], vidx[4], vidx[5]], [vidx[0], vidx[5], vidx[1]], // Front
                [vidx[1], vidx[5], vidx[6]], [vidx[1], vidx[6], vidx[2]], // Right
                [vidx[2], vidx[6], vidx[7]], [vidx[2], vidx[7], vidx[3]], // Back
                [vidx[3], vidx[7], vidx[4]], [vidx[3], vidx[4], vidx[0]]  // Left
            ];
            
            for (const face of faces) {
                tris.push(`      <triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}" />`);
            }
        }
    }
    
    // Build component items
    const items: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const meshId = i + 2;
        items.push(`    <item objectid="${meshId}" />`);
    }
    
    const model3mf = generateModel3MF(materials, meshes, items);
    const rels = generateRels();
    const contentTypes = generateContentTypes();
    
    return createZip({
        "3D/3dmodel.model": model3mf,
        "_rels/.rels": rels,
        "[Content_Types].xml": contentTypes
    });
}

function generateMeshXml(id: number, vertices: string[], triangles: string[]): string {
    return `  <object id="${id}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`;
}

function generateModel3MF(materials: string[], meshes: string[], items: string[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Application">Firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${meshes.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function createZip(files: Record<string, string>): Blob {
    // Simple ZIP file implementation
    // This is a minimal implementation for creating a ZIP archive
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;
    
    for (const [filename, content] of Object.entries(files)) {
        const nameBytes = encoder.encode(filename);
        const contentBytes = encoder.encode(content);
        
        // Local file header
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(localHeader.buffer);
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed to extract
        view.setUint16(6, 0, true); // General purpose bit flag
        view.setUint16(8, 0, true); // Compression method (0 = no compression)
        view.setUint16(10, 0, true); // File last modification time
        view.setUint16(12, 0, true); // File last modification date
        view.setUint32(14, crc32(contentBytes), true); // CRC-32
        view.setUint32(18, contentBytes.length, true); // Compressed size
        view.setUint32(22, contentBytes.length, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true); // File name length
        view.setUint16(28, 0, true); // Extra field length
        localHeader.set(nameBytes, 30);
        
        chunks.push(localHeader);
        chunks.push(contentBytes);
        
        // Central directory file header
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(centralHeader.buffer);
        cdView.setUint32(0, 0x02014b50, true); // Central directory file header signature
        cdView.setUint16(4, 20, true); // Version made by
        cdView.setUint16(6, 20, true); // Version needed to extract
        cdView.setUint16(8, 0, true); // General purpose bit flag
        cdView.setUint16(10, 0, true); // Compression method
        cdView.setUint16(12, 0, true); // File last modification time
        cdView.setUint16(14, 0, true); // File last modification date
        cdView.setUint32(16, crc32(contentBytes), true); // CRC-32
        cdView.setUint32(20, contentBytes.length, true); // Compressed size
        cdView.setUint32(24, contentBytes.length, true); // Uncompressed size
        cdView.setUint16(28, nameBytes.length, true); // File name length
        cdView.setUint16(30, 0, true); // Extra field length
        cdView.setUint16(32, 0, true); // File comment length
        cdView.setUint16(34, 0, true); // Disk number start
        cdView.setUint16(36, 0, true); // Internal file attributes
        cdView.setUint32(38, 0, true); // External file attributes
        cdView.setUint32(42, offset, true); // Relative offset of local header
        centralHeader.set(nameBytes, 46);
        
        centralDir.push(centralHeader);
        offset += localHeader.length + contentBytes.length;
    }
    
    const centralDirSize = centralDir.reduce((sum, arr) => sum + arr.length, 0);
    
    // End of central directory record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk where central directory starts
    eocdView.setUint16(8, Object.keys(files).length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, Object.keys(files).length, true); // Total number of central directory records
    eocdView.setUint32(12, centralDirSize, true); // Size of central directory
    eocdView.setUint32(16, offset, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // ZIP file comment length
    
    return new Blob([...chunks, ...centralDir, eocd], { type: 'application/zip' });
}

function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc = crc ^ data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}
