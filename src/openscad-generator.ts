import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface OpenScadMasksSettings {
    layerHeight: number;
    filename: string;
}

declare const JSZip: any;

export async function generateOpenScadMasks(image: PartListImage, settings: OpenScadMasksSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one mask image per color
    const imageFiles: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskData = createMaskImage(image, i);
        const filename = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        imageFiles.push(filename);
        zip.file(filename, maskData.split(',')[1], { base64: true });
    }
    
    // Create OpenSCAD file
    const scadContent = createOpenScadFile(image, imageFiles, settings.layerHeight);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function createMaskImage(image: PartListImage, colorIndex: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black pixels where this color exists
    ctx.fillStyle = '#000000';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    return canvas.toDataURL('image/png');
}

function createOpenScadFile(
    image: PartListImage,
    imageFiles: string[],
    layerHeight: number
): string {
    const pixelSize = 1.0; // 1mm per pixel
    
    let scadContent = `// Generated OpenSCAD file for multi-color image
// Image size: ${image.width}x${image.height} pixels
// Pixel size: ${pixelSize}mm
// Layer height: ${layerHeight}mm

`;
    
    // Add color definitions
    scadContent += '// Color definitions\n';
    image.partList.forEach((part, i) => {
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRgbArray(hex);
        scadContent += `color_${i} = [${rgb[0]}, ${rgb[1]}, ${rgb[2]}]; // ${part.target.name}\n`;
    });
    scadContent += '\n';
    
    // Add module for creating heightmap layer
    scadContent += `// Module to create a layer from heightmap
module heightmap_layer(image_file, color_rgb, z_offset) {
    color(color_rgb)
    translate([0, 0, z_offset])
    scale([${pixelSize}, ${pixelSize}, ${layerHeight}])
    surface(file = image_file, center = false, invert = true);
}

`;
    
    // Create union of all layers
    scadContent += '// Combine all color layers\n';
    scadContent += 'union() {\n';
    imageFiles.forEach((filename, i) => {
        scadContent += `    heightmap_layer("${filename}", color_${i}, 0);\n`;
    });
    scadContent += '}\n';
    
    return scadContent;
}

function hexToRgbArray(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 0, 0];
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    return [r, g, b];
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
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

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const tagName = 'jszip-script-tag';
        const scriptEl = document.getElementById(tagName);
        
        if (scriptEl !== null || typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const tag = document.createElement('script');
        tag.id = tagName;
        tag.onload = () => resolve();
        tag.onerror = () => reject(new Error('Failed to load JSZip'));
        tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(tag);
    });
}
