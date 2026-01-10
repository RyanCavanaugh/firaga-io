import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ExportOpenSCADSettings {
    pixelHeight: number;
    baseHeight: number;
    pixelSize: number;
}

export function exportOpenSCADMasks(image: PartListImage, settings: ExportOpenSCADSettings): Blob {
    const { pixelHeight, baseHeight, pixelSize } = settings;
    
    const masks = generateColorMasks(image);
    const scadFile = generateOpenSCADFile(image, masks.length, pixelHeight, baseHeight, pixelSize);
    
    return createZip(masks, scadFile);
}

interface ColorMask {
    colorIndex: number;
    colorName: string;
    colorHex: string;
    imageData: ImageData;
}

function generateColorMasks(image: PartListImage): ColorMask[] {
    const masks: ColorMask[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                
                imageData.data[idx] = isThisColor ? 255 : 0;
                imageData.data[idx + 1] = isThisColor ? 255 : 0;
                imageData.data[idx + 2] = isThisColor ? 255 : 0;
                imageData.data[idx + 3] = 255;
            }
        }
        
        const partEntry = image.partList[colorIdx];
        masks.push({
            colorIndex: colorIdx,
            colorName: partEntry.target.name.replace(/[^a-zA-Z0-9]/g, '_'),
            colorHex: colorEntryToHex(partEntry.target),
            imageData
        });
    }
    
    return masks;
}

function generateOpenSCADFile(image: PartListImage, maskCount: number, pixelHeight: number, baseHeight: number, pixelSize: number): string {
    const colorParts: string[] = [];
    
    for (let i = 0; i < maskCount; i++) {
        const partEntry = image.partList[i];
        const colorName = partEntry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const colorHex = colorEntryToHex(partEntry.target);
        
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;
        
        colorParts.push(`
// ${partEntry.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${baseHeight}])
surface(file = "mask_${colorName}.png", center = true, invert = true);
`);
    }
    
    const scadContent = `// Generated OpenSCAD file for 3D pixel art
// Image size: ${image.width}x${image.height}
// Pixel size: ${pixelSize}mm
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

$fn = 50;

module pixel_layer(mask_file, color_rgb, height) {
    color(color_rgb)
    linear_extrude(height = height)
    scale([${pixelSize}, ${pixelSize}, 1])
    surface(file = mask_file, center = false, invert = true);
}

union() {
${colorParts.map((part, idx) => {
    const partEntry = image.partList[idx];
    const colorName = partEntry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
    const colorHex = colorEntryToHex(partEntry.target);
    const r = parseInt(colorHex.slice(1, 3), 16) / 255;
    const g = parseInt(colorHex.slice(3, 5), 16) / 255;
    const b = parseInt(colorHex.slice(5, 7), 16) / 255;
    
    return `    // ${partEntry.target.name}
    pixel_layer("mask_${colorName}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}], ${pixelHeight});`;
}).join('\n')}
}
`;
    
    return scadContent;
}

function createZip(masks: ColorMask[], scadFile: string): Blob {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;
    
    const files: Array<{ name: string; content: Uint8Array }> = [];
    
    files.push({
        name: 'model.scad',
        content: encoder.encode(scadFile)
    });
    
    for (const mask of masks) {
        const canvas = document.createElement('canvas');
        canvas.width = mask.imageData.width;
        canvas.height = mask.imageData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.putImageData(mask.imageData, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            files.push({
                name: `mask_${mask.colorName}.png`,
                content: bytes
            });
        }
    }
    
    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(localHeader.buffer);
        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 0, true);
        view.setUint16(8, 0, true);
        view.setUint16(10, 0, true);
        view.setUint16(12, 0, true);
        view.setUint32(14, crc32(file.content), true);
        view.setUint32(18, file.content.length, true);
        view.setUint32(22, file.content.length, true);
        view.setUint16(26, nameBytes.length, true);
        view.setUint16(28, 0, true);
        localHeader.set(nameBytes, 30);
        
        chunks.push(localHeader, file.content);
        
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true);
        centralView.setUint16(4, 20, true);
        centralView.setUint16(6, 20, true);
        centralView.setUint16(8, 0, true);
        centralView.setUint16(10, 0, true);
        centralView.setUint16(12, 0, true);
        centralView.setUint16(14, 0, true);
        centralView.setUint32(16, crc32(file.content), true);
        centralView.setUint32(20, file.content.length, true);
        centralView.setUint32(24, file.content.length, true);
        centralView.setUint16(28, nameBytes.length, true);
        centralView.setUint16(30, 0, true);
        centralView.setUint16(32, 0, true);
        centralView.setUint16(34, 0, true);
        centralView.setUint16(36, 0, true);
        centralView.setUint32(38, 0, true);
        centralView.setUint32(42, offset, true);
        centralHeader.set(nameBytes, 46);
        
        centralDir.push(centralHeader);
        offset += localHeader.length + file.content.length;
    }
    
    const centralDirBlob = new Uint8Array(centralDir.reduce((sum, arr) => sum + arr.length, 0));
    let centralDirOffset = 0;
    for (const arr of centralDir) {
        centralDirBlob.set(arr, centralDirOffset);
        centralDirOffset += arr.length;
    }
    
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, files.length, true);
    eocdView.setUint16(10, files.length, true);
    eocdView.setUint32(12, centralDirBlob.length, true);
    eocdView.setUint32(16, offset, true);
    eocdView.setUint16(20, 0, true);
    
    return new Blob([...chunks, centralDirBlob, eocd], { type: 'application/zip' });
}

function crc32(data: Uint8Array): number {
    let crc = -1;
    for (let i = 0; i < data.length; i++) {
        crc = crc ^ data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xEDB88320 & (-(crc & 1)));
        }
    }
    return ~crc >>> 0;
}
