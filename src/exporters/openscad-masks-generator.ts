import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { saveAs } from 'file-saver';

// Simple ZIP file generation without dependencies
// We'll create a minimal ZIP structure for the OpenSCAD masks

export function generateOpenSCADMasks(image: PartListImage, filename: string, gridSize: AppProps["material"]["size"]) {
    const pitch = getPitch(gridSize);
    const { width, height, pixels, partList } = image;
    
    const files: Array<{name: string, content: Uint8Array}> = [];
    
    // Generate one PNG mask per color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const maskData = createMaskImage(pixels, width, height, colorIdx);
        files.push({
            name: `mask_${colorIdx}_${sanitizeFilename(color.target.name)}.png`,
            content: maskData
        });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(partList, width, height, pitch);
    files.push({
        name: 'model.scad',
        content: new TextEncoder().encode(scadContent)
    });
    
    // Create ZIP file
    const zipData = createZipFile(files);
    const blob = new Blob([zipData], { type: 'application/zip' });
    saveAs(blob, `${filename.replace('.png', '')}_openscad.zip`);
}

function createMaskImage(pixels: ReadonlyArray<ReadonlyArray<number>>, width: number, height: number, colorIdx: number): Uint8Array {
    // Create a black and white PNG
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isColor = pixels[y][x] === colorIdx;
            const value = isColor ? 255 : 0; // White for the color, black for others
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to PNG data
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
}

function generateOpenSCADFile(partList: ReadonlyArray<any>, width: number, height: number, pitch: number): string {
    const scadLines = [
        '// OpenSCAD heightmap display',
        '// Each color layer is extruded based on its mask image',
        '',
        `image_width = ${width};`,
        `image_height = ${height};`,
        `pixel_pitch = ${pitch};`,
        `layer_height = 2; // mm`,
        '',
        'module color_layer(filename, color) {',
        '    color(color)',
        '    linear_extrude(height = layer_height)',
        '    scale([pixel_pitch, pixel_pitch, 1])',
        '    surface(file = filename, center = true, invert = false);',
        '}',
        '',
        '// Combine all color layers',
        'union() {'
    ];
    
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i];
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        const filename = `mask_${i}_${sanitizeFilename(color.target.name)}.png`;
        scadLines.push(`    color_layer("${filename}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]); // ${color.target.name}`);
    }
    
    scadLines.push('}');
    
    return scadLines.join('\n');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function createZipFile(files: Array<{name: string, content: Uint8Array}>): Uint8Array {
    // Simple ZIP file structure
    // This is a minimal implementation - for production, use a proper library like JSZip
    
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;
    
    for (const file of files) {
        const filename = encoder.encode(file.name);
        const content = file.content;
        
        // Local file header
        const localHeader = new Uint8Array(30 + filename.length);
        const view = new DataView(localHeader.buffer);
        
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true);         // Version needed to extract
        view.setUint16(6, 0, true);          // General purpose bit flag
        view.setUint16(8, 0, true);          // Compression method (0 = no compression)
        view.setUint16(10, 0, true);         // File last modification time
        view.setUint16(12, 0, true);         // File last modification date
        view.setUint32(14, crc32(content), true); // CRC-32
        view.setUint32(18, content.length, true); // Compressed size
        view.setUint32(22, content.length, true); // Uncompressed size
        view.setUint16(26, filename.length, true); // File name length
        view.setUint16(28, 0, true);         // Extra field length
        
        localHeader.set(filename, 30);
        
        chunks.push(localHeader);
        chunks.push(content);
        
        // Central directory header
        const cdHeader = new Uint8Array(46 + filename.length);
        const cdView = new DataView(cdHeader.buffer);
        
        cdView.setUint32(0, 0x02014b50, true); // Central directory file header signature
        cdView.setUint16(4, 20, true);         // Version made by
        cdView.setUint16(6, 20, true);         // Version needed to extract
        cdView.setUint16(8, 0, true);          // General purpose bit flag
        cdView.setUint16(10, 0, true);         // Compression method
        cdView.setUint16(12, 0, true);         // File last modification time
        cdView.setUint16(14, 0, true);         // File last modification date
        cdView.setUint32(16, crc32(content), true); // CRC-32
        cdView.setUint32(20, content.length, true); // Compressed size
        cdView.setUint32(24, content.length, true); // Uncompressed size
        cdView.setUint16(28, filename.length, true); // File name length
        cdView.setUint16(30, 0, true);         // Extra field length
        cdView.setUint16(32, 0, true);         // File comment length
        cdView.setUint16(34, 0, true);         // Disk number start
        cdView.setUint16(36, 0, true);         // Internal file attributes
        cdView.setUint32(38, 0, true);         // External file attributes
        cdView.setUint32(42, offset, true);    // Relative offset of local header
        
        cdHeader.set(filename, 46);
        centralDirectory.push(cdHeader);
        
        offset += localHeader.length + content.length;
    }
    
    // End of central directory record
    const cdSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    
    eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
    eocdView.setUint16(4, 0, true);          // Number of this disk
    eocdView.setUint16(6, 0, true);          // Disk where central directory starts
    eocdView.setUint16(8, files.length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, files.length, true); // Total number of central directory records
    eocdView.setUint32(12, cdSize, true);    // Size of central directory
    eocdView.setUint32(16, offset, true);    // Offset of start of central directory
    eocdView.setUint16(20, 0, true);         // Comment length
    
    // Combine all parts
    const totalSize = offset + cdSize + eocd.length;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    
    for (const chunk of chunks) {
        result.set(chunk, pos);
        pos += chunk.length;
    }
    
    for (const chunk of centralDirectory) {
        result.set(chunk, pos);
        pos += chunk.length;
    }
    
    result.set(eocd, pos);
    
    return result;
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
