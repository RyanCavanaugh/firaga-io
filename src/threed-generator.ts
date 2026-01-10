import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    height: number; // Height of the 3D model in mm
    pitch: number; // Pitch of each pixel in mm
    filename: string;
}

/**
 * Generate 3D output in the selected format
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const { pitch, height: blockHeight, filename } = settings;

    // Build 3MF XML structure
    let modelXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXML += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">\n';
    
    // Resources section
    modelXML += '  <resources>\n';
    
    // Define materials (colors)
    modelXML += '    <m:colorgroup id="1">\n';
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const color = hex.substring(1); // Remove # prefix
        modelXML += `      <m:color color="#${color}FF" />\n`; // Add alpha channel
    });
    modelXML += '    </m:colorgroup>\n';
    
    let objectId = 2;
    const objectIds: number[] = [];
    
    // Create a mesh object for each color
    partList.forEach((part, partIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        let vertexCount = 0;
        
        // Generate vertices and triangles for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = blockHeight;
                    
                    // 8 vertices of the box
                    const boxVerts: Array<[number, number, number]> = [
                        [x0, y0, z0], // 0
                        [x1, y0, z0], // 1
                        [x1, y1, z0], // 2
                        [x0, y1, z0], // 3
                        [x0, y0, z1], // 4
                        [x1, y0, z1], // 5
                        [x1, y1, z1], // 6
                        [x0, y1, z1], // 7
                    ];
                    
                    const boxVertIndices: number[] = [];
                    for (const vert of boxVerts) {
                        const key = `${vert[0]},${vert[1]},${vert[2]}`;
                        let idx = vertexMap.get(key);
                        if (idx === undefined) {
                            idx = vertexCount++;
                            vertexMap.set(key, idx);
                            vertices.push(vert);
                        }
                        boxVertIndices.push(idx);
                    }
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push([boxVertIndices[0], boxVertIndices[2], boxVertIndices[1]]);
                    triangles.push([boxVertIndices[0], boxVertIndices[3], boxVertIndices[2]]);
                    // Top face (z1)
                    triangles.push([boxVertIndices[4], boxVertIndices[5], boxVertIndices[6]]);
                    triangles.push([boxVertIndices[4], boxVertIndices[6], boxVertIndices[7]]);
                    // Front face (y0)
                    triangles.push([boxVertIndices[0], boxVertIndices[1], boxVertIndices[5]]);
                    triangles.push([boxVertIndices[0], boxVertIndices[5], boxVertIndices[4]]);
                    // Back face (y1)
                    triangles.push([boxVertIndices[3], boxVertIndices[7], boxVertIndices[6]]);
                    triangles.push([boxVertIndices[3], boxVertIndices[6], boxVertIndices[2]]);
                    // Left face (x0)
                    triangles.push([boxVertIndices[0], boxVertIndices[4], boxVertIndices[7]]);
                    triangles.push([boxVertIndices[0], boxVertIndices[7], boxVertIndices[3]]);
                    // Right face (x1)
                    triangles.push([boxVertIndices[1], boxVertIndices[2], boxVertIndices[6]]);
                    triangles.push([boxVertIndices[1], boxVertIndices[6], boxVertIndices[5]]);
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXML += `    <object id="${objectId}" type="model">\n`;
            modelXML += `      <mesh>\n`;
            modelXML += `        <vertices>\n`;
            vertices.forEach(v => {
                modelXML += `          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />\n`;
            });
            modelXML += `        </vertices>\n`;
            modelXML += `        <triangles>\n`;
            triangles.forEach(t => {
                modelXML += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${partIndex}" />\n`;
            });
            modelXML += `        </triangles>\n`;
            modelXML += `      </mesh>\n`;
            modelXML += `    </object>\n`;
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    modelXML += '  </resources>\n';
    
    // Build section
    modelXML += '  <build>\n';
    objectIds.forEach(id => {
        modelXML += `    <item objectid="${id}" />\n`;
    });
    modelXML += '  </build>\n';
    
    modelXML += '</model>\n';
    
    // Create a ZIP file containing the 3MF structure
    // 3MF is actually a ZIP archive with specific structure
    const zip = await createZip();
    await zip.file('[Content_Types].xml', getContentTypesXML());
    await zip.file('3D/3dmodel.model', modelXML);
    await zip.file('_rels/.rels', getRelsXML());
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${filename}.3mf`);
}

/**
 * Generate OpenSCAD masks format (zip with monochrome images + .scad file)
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const { pitch, height: blockHeight, filename } = settings;
    
    const zip = await createZip();
    
    // Generate one black/white PNG for each color
    const imageFiles: string[] = [];
    
    for (let i = 0; i < partList.length; i++) {
        const part = partList[i];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = '#000000';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const pngName = `color_${i}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        imageFiles.push(pngName);
        
        // Convert canvas to blob and add to zip
        const blob = await canvasToBlob(canvas);
        await zip.file(pngName, blob);
    }
    
    // Generate OpenSCAD file
    let scadCode = `// Generated by firaga.io
// 3D model from pixel art
// Each color is extruded from a heightmap PNG

`;
    
    scadCode += `// Configuration
pixel_pitch = ${pitch}; // mm per pixel
extrude_height = ${blockHeight}; // mm height of each block

`;
    
    scadCode += `// Combine all color layers
union() {\n`;
    
    partList.forEach((part, i) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadCode += `  // ${part.target.name}\n`;
        scadCode += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadCode += `  scale([pixel_pitch, pixel_pitch, extrude_height])\n`;
        scadCode += `  surface(file = "${imageFiles[i]}", invert = true);\n\n`;
    });
    
    scadCode += `}\n`;
    
    await zip.file(`${filename}.scad`, scadCode);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

/**
 * Create a JSZip instance (lightweight implementation using browser APIs)
 * This is a minimal ZIP implementation for browser use
 */
async function createZip(): Promise<SimpleZip> {
    return new SimpleZip();
}

class SimpleZip {
    private files = new Map<string, Blob | string>();
    
    async file(path: string, content: Blob | string): Promise<void> {
        this.files.set(path, content);
    }
    
    async generateAsync(options: { type: 'blob' }): Promise<Blob> {
        // Create a proper ZIP file using the ZIP file format
        const encoder = new TextEncoder();
        const centralDirectory: Uint8Array[] = [];
        const localFiles: Uint8Array[] = [];
        let offset = 0;
        
        for (const [path, content] of this.files) {
            const pathBytes = encoder.encode(path);
            const dataBytes = typeof content === 'string'
                ? encoder.encode(content)
                : new Uint8Array(await content.arrayBuffer());
            
            // Local file header
            const localHeader = new Uint8Array(30 + pathBytes.length);
            const localView = new DataView(localHeader.buffer);
            localView.setUint32(0, 0x04034b50, true); // Local file header signature
            localView.setUint16(4, 20, true); // Version needed to extract
            localView.setUint16(6, 0, true); // General purpose bit flag
            localView.setUint16(8, 0, true); // Compression method (0 = no compression)
            localView.setUint16(10, 0, true); // File last modification time
            localView.setUint16(12, 0, true); // File last modification date
            localView.setUint32(14, crc32(dataBytes), true); // CRC-32
            localView.setUint32(18, dataBytes.length, true); // Compressed size
            localView.setUint32(22, dataBytes.length, true); // Uncompressed size
            localView.setUint16(26, pathBytes.length, true); // File name length
            localView.setUint16(28, 0, true); // Extra field length
            localHeader.set(pathBytes, 30);
            
            localFiles.push(localHeader);
            localFiles.push(dataBytes);
            
            // Central directory header
            const cdHeader = new Uint8Array(46 + pathBytes.length);
            const cdView = new DataView(cdHeader.buffer);
            cdView.setUint32(0, 0x02014b50, true); // Central directory signature
            cdView.setUint16(4, 20, true); // Version made by
            cdView.setUint16(6, 20, true); // Version needed to extract
            cdView.setUint16(8, 0, true); // General purpose bit flag
            cdView.setUint16(10, 0, true); // Compression method
            cdView.setUint16(12, 0, true); // File last modification time
            cdView.setUint16(14, 0, true); // File last modification date
            cdView.setUint32(16, crc32(dataBytes), true); // CRC-32
            cdView.setUint32(20, dataBytes.length, true); // Compressed size
            cdView.setUint32(24, dataBytes.length, true); // Uncompressed size
            cdView.setUint16(28, pathBytes.length, true); // File name length
            cdView.setUint16(30, 0, true); // Extra field length
            cdView.setUint16(32, 0, true); // File comment length
            cdView.setUint16(34, 0, true); // Disk number start
            cdView.setUint16(36, 0, true); // Internal file attributes
            cdView.setUint32(38, 0, true); // External file attributes
            cdView.setUint32(42, offset, true); // Relative offset of local header
            cdHeader.set(pathBytes, 46);
            
            centralDirectory.push(cdHeader);
            offset += localHeader.length + dataBytes.length;
        }
        
        // End of central directory record
        const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.length, 0);
        const eocd = new Uint8Array(22);
        const eocdView = new DataView(eocd.buffer);
        eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
        eocdView.setUint16(4, 0, true); // Number of this disk
        eocdView.setUint16(6, 0, true); // Disk where central directory starts
        eocdView.setUint16(8, this.files.size, true); // Number of central directory records on this disk
        eocdView.setUint16(10, this.files.size, true); // Total number of central directory records
        eocdView.setUint32(12, cdSize, true); // Size of central directory
        eocdView.setUint32(16, offset, true); // Offset of start of central directory
        eocdView.setUint16(20, 0, true); // Comment length
        
        // Combine all parts
        const parts = [...localFiles, ...centralDirectory, eocd];
        return new Blob(parts, { type: 'application/zip' });
    }
}

// Simple CRC-32 implementation
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

/**
 * Convert canvas to blob
 */
async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, 'image/png');
    });
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generate [Content_Types].xml for 3MF
 */
function getContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

/**
 * Generate _rels/.rels for 3MF
 */
function getRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}
