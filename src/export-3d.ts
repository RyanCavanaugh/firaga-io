import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export async function export3MF(image: PartListImage, filename: string): Promise<void> {
    const blob = generate3MFBlob(image);
    downloadBlob(blob, `${filename}.3mf`);
}

export async function exportOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    const blob = await generateOpenSCADMasksZip(image, filename);
    downloadBlob(blob, `${filename}.zip`);
}

function generate3MFBlob(image: PartListImage): Blob {
    const modelXML = generate3MFModel(image);
    const relsXML = generate3MFRels();
    const contentTypesXML = generate3MFContentTypes();
    
    // Create a simple ZIP structure for 3MF
    const files = [
        { name: "[Content_Types].xml", content: contentTypesXML },
        { name: "_rels/.rels", content: relsXML },
        { name: "3D/3dmodel.model", content: modelXML }
    ];
    
    return createZipBlob(files);
}

function generate3MFModel(image: PartListImage): string {
    const { width, height, pixels, partList } = image;
    const pixelHeight = 0.5; // Height of each pixel in mm
    const pixelSize = 1.0; // Size of each pixel in mm
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Create materials for each color
    xml += '    <basematerials id="1">\n';
    partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target).substring(1); // Remove #
        xml += `      <base name="${escapeXML(entry.target.name)}" displaycolor="#${hex}" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Create mesh objects for each color
    partList.forEach((entry, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices for a box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${colorIdx + 2}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    partList.forEach((_, colorIdx) => {
        xml += `    <item objectid="${colorIdx + 2}" />\n`;
    });
    xml += '  </build>\n';
    xml += '</model>\n';
    
    return xml;
}

function generate3MFRels(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
    xml += '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n';
    xml += '</Relationships>\n';
    return xml;
}

function generate3MFContentTypes(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
    xml += '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n';
    xml += '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n';
    xml += '</Types>\n';
    return xml;
}

async function generateOpenSCADMasksZip(image: PartListImage, filename: string): Promise<Blob> {
    const { width, height, pixels, partList } = image;
    const files: Array<{ name: string; content: string | Uint8Array }> = [];
    
    // Create a monochrome PNG for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const imageData = createMaskImageData(image, colorIdx);
        const pngData = await imageToPNG(imageData);
        files.push({
            name: `color_${colorIdx}_${sanitizeFilename(partList[colorIdx].target.name)}.png`,
            content: pngData
        });
    }
    
    // Create the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, filename);
    files.push({ name: `${filename}.scad`, content: scadContent });
    
    return createZipBlob(files);
}

function createMaskImageData(image: PartListImage, colorIdx: number): ImageData {
    const { width, height, pixels } = image;
    const imageData = new ImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isColor = pixels[y][x] === colorIdx;
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }
    
    return imageData;
}

async function imageToPNG(imageData: ImageData): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.putImageData(imageData, 0, 0);
    
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
        }, 'image/png');
    });
    
    return new Uint8Array(await blob.arrayBuffer());
}

function generateOpenSCADFile(image: PartListImage, filename: string): string {
    const { width, height, partList } = image;
    const pixelSize = 1.0;
    const heightScale = 0.5;
    
    let scad = `// Generated by firaga.io for ${filename}\n`;
    scad += `// Image size: ${width}x${height}\n\n`;
    
    scad += `pixel_size = ${pixelSize};\n`;
    scad += `height_scale = ${heightScale};\n\n`;
    
    scad += `union() {\n`;
    
    partList.forEach((entry, colorIdx) => {
        const colorName = sanitizeFilename(entry.target.name);
        const hex = colorEntryToHex(entry.target).substring(1);
        scad += `  // ${entry.target.name}\n`;
        scad += `  color("#${hex}")\n`;
        scad += `    surface(file = "color_${colorIdx}_${colorName}.png", center = false, invert = true);\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function escapeXML(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function createZipBlob(files: Array<{ name: string; content: string | Uint8Array }>): Blob {
    // Simple ZIP implementation for browser
    // This is a minimal implementation that works for basic cases
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;
    
    files.forEach(file => {
        const nameBytes = encoder.encode(file.name);
        const contentBytes = typeof file.content === 'string' 
            ? encoder.encode(file.content) 
            : file.content;
        
        // Local file header
        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed
        view.setUint16(6, 0, true); // Flags
        view.setUint16(8, 0, true); // Compression method (none)
        view.setUint16(10, 0, true); // Mod time
        view.setUint16(12, 0, true); // Mod date
        view.setUint32(14, crc32(contentBytes), true); // CRC-32
        view.setUint32(18, contentBytes.length, true); // Compressed size
        view.setUint32(22, contentBytes.length, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true); // Filename length
        view.setUint16(28, 0, true); // Extra field length
        header.set(nameBytes, 30);
        
        chunks.push(header, contentBytes);
        
        // Central directory header
        const cdHeader = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(cdHeader.buffer);
        cdView.setUint32(0, 0x02014b50, true); // Central directory signature
        cdView.setUint16(4, 20, true); // Version made by
        cdView.setUint16(6, 20, true); // Version needed
        cdView.setUint16(8, 0, true); // Flags
        cdView.setUint16(10, 0, true); // Compression method
        cdView.setUint16(12, 0, true); // Mod time
        cdView.setUint16(14, 0, true); // Mod date
        cdView.setUint32(16, crc32(contentBytes), true); // CRC-32
        cdView.setUint32(20, contentBytes.length, true); // Compressed size
        cdView.setUint32(24, contentBytes.length, true); // Uncompressed size
        cdView.setUint16(28, nameBytes.length, true); // Filename length
        cdView.setUint16(30, 0, true); // Extra field length
        cdView.setUint16(32, 0, true); // Comment length
        cdView.setUint16(34, 0, true); // Disk number
        cdView.setUint16(36, 0, true); // Internal attributes
        cdView.setUint32(38, 0, true); // External attributes
        cdView.setUint32(42, offset, true); // Offset of local header
        cdHeader.set(nameBytes, 46);
        
        centralDir.push(cdHeader);
        offset += header.length + contentBytes.length;
    });
    
    const cdSize = centralDir.reduce((sum, arr) => sum + arr.length, 0);
    
    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
    eocdView.setUint16(4, 0, true); // Disk number
    eocdView.setUint16(6, 0, true); // Central directory disk
    eocdView.setUint16(8, files.length, true); // Entries on this disk
    eocdView.setUint16(10, files.length, true); // Total entries
    eocdView.setUint32(12, cdSize, true); // Central directory size
    eocdView.setUint32(16, offset, true); // Central directory offset
    eocdView.setUint16(20, 0, true); // Comment length
    
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
    return ~crc >>> 0;
}

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
