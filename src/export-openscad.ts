import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ExportOpenSCADSettings {
    pixelSize: number;
    heightScale: number;
}

/**
 * Exports a PartListImage to OpenSCAD masks format
 * Creates a ZIP file with:
 * - One monochrome PNG per color (black/white mask)
 * - An OpenSCAD file that loads and combines them
 */
export async function exportOpenSCADMasks(
    image: PartListImage, 
    settings: ExportOpenSCADSettings
): Promise<Blob> {
    const { pixelSize, heightScale } = settings;
    
    // Generate PNG masks for each color
    const masks: Array<{ name: string; data: Blob; color: string }> = [];
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        if (part.count === 0) continue;
        
        const maskCanvas = createMaskCanvas(image, i);
        const blob = await canvasToBlob(maskCanvas);
        const colorName = sanitizeFilename(part.target.name);
        
        masks.push({
            name: `mask_${i}_${colorName}.png`,
            data: blob,
            color: colorEntryToHex(part.target)
        });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, masks, pixelSize, heightScale);
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    
    // Create ZIP file
    const files: Array<{ name: string; content: Blob }> = [
        { name: 'display.scad', content: scadBlob },
        ...masks.map(m => ({ name: m.name, content: m.data }))
    ];
    
    return createZipBlob(files);
}

function createMaskCanvas(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    // Create black/white mask: white where this color is present, black elsewhere
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelColorIdx = image.pixels[y][x];
            
            if (pixelColorIdx === colorIndex) {
                // White for this color
                imageData.data[idx + 0] = 255;
                imageData.data[idx + 1] = 255;
                imageData.data[idx + 2] = 255;
                imageData.data[idx + 3] = 255;
            } else {
                // Black for other colors or transparent
                imageData.data[idx + 0] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 255;
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob from canvas'));
            }
        }, 'image/png');
    });
}

function generateOpenSCADFile(
    image: PartListImage,
    masks: Array<{ name: string; data: Blob; color: string }>,
    pixelSize: number,
    heightScale: number
): string {
    const layers: string[] = [];
    
    masks.forEach((mask, idx) => {
        const part = image.partList[idx];
        const colorHex = mask.color;
        const r = parseInt(colorHex.substring(1, 3), 16) / 255;
        const g = parseInt(colorHex.substring(3, 5), 16) / 255;
        const b = parseInt(colorHex.substring(5, 7), 16) / 255;
        
        layers.push(`
// Layer ${idx}: ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${idx * heightScale}])
surface(file = "${mask.name}", center = true, invert = true);
`);
    });
    
    return `// Generated OpenSCAD file for pixel art display
// Image dimensions: ${image.width}x${image.height}
// Pixel size: ${pixelSize}mm
// Layer height: ${heightScale}mm

$fn = 20;

pixel_size = ${pixelSize};
layer_height = ${heightScale};
width = ${image.width};
height = ${image.height};

// Scale the surface to match pixel size
scale([pixel_size / width, pixel_size / height, layer_height]) {
${layers.join('\n')}
}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

async function createZipBlob(files: Array<{ name: string; content: Blob }>): Promise<Blob> {
    // Simple ZIP file creation
    const entries: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;
    
    const encoder = new TextEncoder();
    
    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        const contentBytes = new Uint8Array(await file.content.arrayBuffer());
        
        // Local file header
        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);
        
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed
        view.setUint16(6, 0, true); // General purpose bit flag
        view.setUint16(8, 0, true); // Compression method (0 = stored)
        view.setUint16(10, 0, true); // File modification time
        view.setUint16(12, 0, true); // File modification date
        view.setUint32(14, crc32(contentBytes), true); // CRC-32
        view.setUint32(18, contentBytes.length, true); // Compressed size
        view.setUint32(22, contentBytes.length, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true); // File name length
        view.setUint16(28, 0, true); // Extra field length
        
        header.set(nameBytes, 30);
        
        entries.push(header);
        entries.push(contentBytes);
        
        // Central directory header
        const cdHeader = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(cdHeader.buffer);
        
        cdView.setUint32(0, 0x02014b50, true); // Central directory signature
        cdView.setUint16(4, 20, true); // Version made by
        cdView.setUint16(6, 20, true); // Version needed
        cdView.setUint16(8, 0, true); // General purpose bit flag
        cdView.setUint16(10, 0, true); // Compression method
        cdView.setUint16(12, 0, true); // File modification time
        cdView.setUint16(14, 0, true); // File modification date
        cdView.setUint32(16, crc32(contentBytes), true); // CRC-32
        cdView.setUint32(20, contentBytes.length, true); // Compressed size
        cdView.setUint32(24, contentBytes.length, true); // Uncompressed size
        cdView.setUint16(28, nameBytes.length, true); // File name length
        cdView.setUint16(30, 0, true); // Extra field length
        cdView.setUint16(32, 0, true); // File comment length
        cdView.setUint16(34, 0, true); // Disk number start
        cdView.setUint16(36, 0, true); // Internal file attributes
        cdView.setUint32(38, 0, true); // External file attributes
        cdView.setUint32(42, offset, true); // Relative offset
        
        cdHeader.set(nameBytes, 46);
        
        centralDirectory.push(cdHeader);
        offset += header.length + contentBytes.length;
    }
    
    const cdSize = centralDirectory.reduce((sum, arr) => sum + arr.length, 0);
    
    // End of central directory record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    
    eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk where CD starts
    eocdView.setUint16(8, files.length, true); // Number of CD records on this disk
    eocdView.setUint16(10, files.length, true); // Total number of CD records
    eocdView.setUint32(12, cdSize, true); // Size of central directory
    eocdView.setUint32(16, offset, true); // Offset of start of CD
    eocdView.setUint16(20, 0, true); // Comment length
    
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
    
    return new Blob([result], { type: 'application/zip' });
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
