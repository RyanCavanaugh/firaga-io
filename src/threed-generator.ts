import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = "3mf" | "openscad";

const PIXEL_HEIGHT = 1.0;
const PIXEL_SIZE = 1.0;

export function generate3DExport(image: PartListImage, format: ThreeDFormat, filename: string): void {
    if (format === "3mf") {
        generate3MF(image, filename);
    } else {
        generateOpenSCADMasks(image, filename);
    }
}

function generate3MF(image: PartListImage, filename: string): void {
    const meshes: string[] = [];
    const resources: string[] = [];
    let resourceId = 1;
    let componentId = 1;

    // Create a mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        let vertexIndex = 0;

        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * PIXEL_SIZE;
                    const x1 = (x + 1) * PIXEL_SIZE;
                    const y0 = y * PIXEL_SIZE;
                    const y1 = (y + 1) * PIXEL_SIZE;
                    const z0 = 0;
                    const z1 = PIXEL_HEIGHT;

                    // 8 vertices of the cube
                    const baseIdx = vertexIndex;
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    vertexIndex += 8;

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left face
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            const verticesXml = vertices
                .map(v => `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`)
                .join('\n      ');
            
            const trianglesXml = triangles
                .map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`)
                .join('\n      ');

            const hex = colorEntryToHex(part.target).substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const colorHex = `#${hex.toUpperCase()}`;

            // Create base material resource
            const baseMaterialId = resourceId++;
            resources.push(`    <basematerials id="${baseMaterialId}">
      <base name="${escapeXml(part.target.name)}" displaycolor="${colorHex}" />
    </basematerials>`);

            // Create mesh resource
            const meshId = resourceId++;
            meshes.push(`    <object id="${meshId}" name="${escapeXml(part.target.name)}" type="model" pid="${baseMaterialId}" pindex="0">
      <mesh>
        <vertices>
      ${verticesXml}
        </vertices>
        <triangles>
      ${trianglesXml}
        </triangles>
      </mesh>
    </object>`);
        }
    });

    // Build component that references all meshes
    const componentReferences = meshes
        .map((_, idx) => `      <component objectid="${idx + 2}" />`)
        .join('\n');

    const buildItem = `    <object id="1" name="Image" type="model">
      <components>
${componentReferences}
      </components>
    </object>`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${buildItem}
${resources.join('\n')}
${meshes.join('\n')}
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    downloadFile(xml, `${filename}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    return new Promise((resolve) => {
        const files: Array<{ name: string; data: Blob }> = [];
        const scadLines: string[] = [];

        scadLines.push('// OpenSCAD height map display');
        scadLines.push('// Generated by firaga.io');
        scadLines.push('');
        scadLines.push(`pixel_size = ${PIXEL_SIZE};`);
        scadLines.push(`pixel_height = ${PIXEL_HEIGHT};`);
        scadLines.push('');

        let processedColors = 0;

        image.partList.forEach((part, colorIndex) => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d')!;
            
            // Fill with white (empty)
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw black pixels where this color appears
            ctx.fillStyle = 'black';
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[y][x] === colorIndex) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }

            const pngName = `color_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
            const hex = colorEntryToHex(part.target).substring(1);
            
            scadLines.push(`// ${part.target.name} (${part.count} pixels)`);
            scadLines.push(`color("#${hex}")`);
            scadLines.push(`  translate([0, 0, ${colorIndex * PIXEL_HEIGHT}])`);
            scadLines.push(`    scale([pixel_size, pixel_size, pixel_height])`);
            scadLines.push(`      surface(file = "${pngName}", invert = true);`);
            scadLines.push('');

            canvas.toBlob((blob) => {
                if (blob) {
                    files.push({ name: pngName, data: blob });
                }
                processedColors++;
                
                if (processedColors === image.partList.length) {
                    const scadContent = scadLines.join('\n');
                    files.push({
                        name: `${filename}.scad`,
                        data: new Blob([scadContent], { type: 'text/plain' })
                    });
                    
                    createZipAndDownload(files, `${filename}_openscad.zip`);
                    resolve();
                }
            });
        });
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function createZipAndDownload(files: Array<{ name: string; data: Blob }>, zipFilename: string): Promise<void> {
    // Simple ZIP implementation for browser
    // We'll use a library-free approach by creating a basic ZIP structure
    
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
        const filenameBytes = encoder.encode(file.name);
        const fileData = new Uint8Array(await file.data.arrayBuffer());
        
        // Local file header
        const localHeader = new Uint8Array(30 + filenameBytes.length);
        const view = new DataView(localHeader.buffer);
        
        view.setUint32(0, 0x04034b50, true); // signature
        view.setUint16(4, 20, true); // version
        view.setUint16(6, 0, true); // flags
        view.setUint16(8, 0, true); // compression (none)
        view.setUint16(10, 0, true); // mod time
        view.setUint16(12, 0, true); // mod date
        view.setUint32(14, crc32(fileData), true); // crc32
        view.setUint32(18, fileData.length, true); // compressed size
        view.setUint32(22, fileData.length, true); // uncompressed size
        view.setUint16(26, filenameBytes.length, true); // filename length
        view.setUint16(28, 0, true); // extra field length
        
        localHeader.set(filenameBytes, 30);
        
        chunks.push(localHeader);
        chunks.push(fileData);
        
        // Central directory header
        const cdHeader = new Uint8Array(46 + filenameBytes.length);
        const cdView = new DataView(cdHeader.buffer);
        
        cdView.setUint32(0, 0x02014b50, true); // signature
        cdView.setUint16(4, 20, true); // version made by
        cdView.setUint16(6, 20, true); // version needed
        cdView.setUint16(8, 0, true); // flags
        cdView.setUint16(10, 0, true); // compression
        cdView.setUint16(12, 0, true); // mod time
        cdView.setUint16(14, 0, true); // mod date
        cdView.setUint32(16, crc32(fileData), true); // crc32
        cdView.setUint32(20, fileData.length, true); // compressed size
        cdView.setUint32(24, fileData.length, true); // uncompressed size
        cdView.setUint16(28, filenameBytes.length, true); // filename length
        cdView.setUint16(30, 0, true); // extra field length
        cdView.setUint16(32, 0, true); // comment length
        cdView.setUint16(34, 0, true); // disk number
        cdView.setUint16(36, 0, true); // internal attrs
        cdView.setUint32(38, 0, true); // external attrs
        cdView.setUint32(42, offset, true); // relative offset
        
        cdHeader.set(filenameBytes, 46);
        centralDirectory.push(cdHeader);
        
        offset += localHeader.length + fileData.length;
    }
    
    const cdData = new Uint8Array(
        centralDirectory.reduce((sum, cd) => sum + cd.length, 0)
    );
    let cdOffset = 0;
    for (const cd of centralDirectory) {
        cdData.set(cd, cdOffset);
        cdOffset += cd.length;
    }
    
    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // signature
    eocdView.setUint16(4, 0, true); // disk number
    eocdView.setUint16(6, 0, true); // cd disk number
    eocdView.setUint16(8, files.length, true); // cd entries on disk
    eocdView.setUint16(10, files.length, true); // cd entries total
    eocdView.setUint32(12, cdData.length, true); // cd size
    eocdView.setUint32(16, offset, true); // cd offset
    eocdView.setUint16(20, 0, true); // comment length
    
    const allChunks = [...chunks, cdData, eocd];
    const totalLength = allChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const zipData = new Uint8Array(totalLength);
    let zipOffset = 0;
    for (const chunk of allChunks) {
        zipData.set(chunk, zipOffset);
        zipOffset += chunk.length;
    }
    
    const blob = new Blob([zipData], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function crc32(data: Uint8Array): number {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}
