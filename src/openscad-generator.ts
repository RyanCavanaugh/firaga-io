import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';
import * as FileSaver from 'file-saver';

export type OpenSCADSettings = {
    filename: string;
    layerHeight: number;
    pixelSize: number;
};

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings) {
    const { filename, layerHeight, pixelSize } = settings;
    
    // We need JSZip for creating the zip file
    // For now, we'll use a simple approach with creating individual files
    // In a production environment, you'd want to use JSZip library
    
    const files: { name: string, content: Blob | string }[] = [];
    
    // Generate mask images for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const maskCanvas = createMaskImage(image, colorIndex);
        const blob = await canvasToBlob(maskCanvas);
        const colorName = sanitizeFilename(part.target.name);
        files.push({
            name: `mask_${colorIndex}_${colorName}.png`,
            content: blob
        });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, layerHeight, pixelSize);
    files.push({
        name: 'model.scad',
        content: scadContent
    });
    
    // Create a simple zip-like structure
    // Since we can't easily create a real zip without a library, we'll download files separately
    // or use a basic implementation
    await downloadAsZip(files, filename);
}

function createMaskImage(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelIndex = (y * image.width + x) * 4;
            const isThisColor = image.pixels[y][x] === colorIndex;
            
            // White for the color, black for background
            const value = isThisColor ? 255 : 0;
            imageData.data[pixelIndex] = value;     // R
            imageData.data[pixelIndex + 1] = value; // G
            imageData.data[pixelIndex + 2] = value; // B
            imageData.data[pixelIndex + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob from canvas'));
            }
        }, 'image/png');
    });
}

function generateOpenSCADFile(image: PartListImage, layerHeight: number, pixelSize: number): string {
    let scad = `// Generated OpenSCAD file for pixel art
// Image size: ${image.width}x${image.height}
// Layer height: ${layerHeight}mm
// Pixel size: ${pixelSize}mm

`;

    image.partList.forEach((part, index) => {
        const colorName = sanitizeFilename(part.target.name);
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRgb(hex);
        
        scad += `// Color: ${part.target.name} (${hex})
module layer_${index}() {
    color([${rgb.r / 255}, ${rgb.g / 255}, ${rgb.b / 255}])
    surface(file = "mask_${index}_${colorName}.png", center = true, invert = true);
}

`;
    });
    
    scad += `// Combine all layers
union() {
`;
    
    image.partList.forEach((_, index) => {
        scad += `    scale([${pixelSize}, ${pixelSize}, ${layerHeight}]) layer_${index}();\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

async function downloadAsZip(files: { name: string, content: Blob | string }[], zipName: string) {
    // Simple implementation: Try to use JSZip if available, otherwise download separately
    // Check if JSZip is available (would need to be added as a dependency)
    if (typeof (window as any).JSZip !== 'undefined') {
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        for (const file of files) {
            zip.file(file.name, file.content);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        FileSaver.saveAs(blob, `${zipName}_openscad.zip`);
    } else {
        // Fallback: create a simple ZIP-like archive manually using basic ZIP format
        const zipBlob = await createSimpleZip(files);
        FileSaver.saveAs(zipBlob, `${zipName}_openscad.zip`);
    }
}

async function createSimpleZip(files: { name: string, content: Blob | string }[]): Promise<Blob> {
    // Simplified ZIP file creation
    // For a proper implementation, we should use JSZip library
    // This is a minimal implementation for demonstration
    
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;
    
    for (const file of files) {
        const filename = encoder.encode(file.name);
        const content = file.content instanceof Blob 
            ? new Uint8Array(await file.content.arrayBuffer())
            : encoder.encode(file.content);
        
        // Local file header
        const localHeader = new Uint8Array(30 + filename.length);
        const view = new DataView(localHeader.buffer);
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed to extract
        view.setUint16(6, 0, true); // General purpose bit flag
        view.setUint16(8, 0, true); // Compression method (0 = none)
        view.setUint16(10, 0, true); // File last modification time
        view.setUint16(12, 0, true); // File last modification date
        view.setUint32(14, 0, true); // CRC-32
        view.setUint32(18, content.length, true); // Compressed size
        view.setUint32(22, content.length, true); // Uncompressed size
        view.setUint16(26, filename.length, true); // File name length
        view.setUint16(28, 0, true); // Extra field length
        localHeader.set(filename, 30);
        
        chunks.push(localHeader);
        chunks.push(content);
        
        // Central directory header
        const centralHeader = new Uint8Array(46 + filename.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true); // Central directory signature
        centralView.setUint16(4, 20, true); // Version made by
        centralView.setUint16(6, 20, true); // Version needed to extract
        centralView.setUint16(8, 0, true); // General purpose bit flag
        centralView.setUint16(10, 0, true); // Compression method
        centralView.setUint16(12, 0, true); // File last modification time
        centralView.setUint16(14, 0, true); // File last modification date
        centralView.setUint32(16, 0, true); // CRC-32
        centralView.setUint32(20, content.length, true); // Compressed size
        centralView.setUint32(24, content.length, true); // Uncompressed size
        centralView.setUint16(28, filename.length, true); // File name length
        centralView.setUint16(30, 0, true); // Extra field length
        centralView.setUint16(32, 0, true); // File comment length
        centralView.setUint16(34, 0, true); // Disk number start
        centralView.setUint16(36, 0, true); // Internal file attributes
        centralView.setUint32(38, 0, true); // External file attributes
        centralView.setUint32(42, offset, true); // Relative offset of local header
        centralHeader.set(filename, 46);
        
        centralDirectory.push(centralHeader);
        
        offset += localHeader.length + content.length;
    }
    
    // End of central directory record
    const centralDirSize = centralDirectory.reduce((sum, arr) => sum + arr.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true); // End of central directory signature
    endView.setUint16(4, 0, true); // Disk number
    endView.setUint16(6, 0, true); // Disk number with start of central directory
    endView.setUint16(8, files.length, true); // Number of central directory records on this disk
    endView.setUint16(10, files.length, true); // Total number of central directory records
    endView.setUint32(12, centralDirSize, true); // Size of central directory
    endView.setUint32(16, offset, true); // Offset of start of central directory
    endView.setUint16(20, 0, true); // Comment length
    
    // Combine all parts
    const allChunks = [...chunks, ...centralDirectory, endRecord];
    const totalLength = allChunks.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of allChunks) {
        result.set(chunk, pos);
        pos += chunk.length;
    }
    
    return new Blob([result], { type: 'application/zip' });
}
