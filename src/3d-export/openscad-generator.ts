import { PartListImage } from '../image-utils';
import { colorEntryToHex, nameOfColor } from '../utils';

declare const JSZip: any;

/**
 * Generate a ZIP file with monochrome masks and an OpenSCAD file
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate a monochrome PNG for each color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskData = generateMaskImage(image, i);
        const colorName = sanitizeFilename(nameOfColor(part.target));
        zip.file(`mask_${i}_${colorName}.png`, maskData.split(',')[1], { base64: true });
    }
    
    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download the zip
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

/**
 * Generate a black/white mask image for a specific color
 */
function generateMaskImage(image: PartListImage, partIndex: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, image.width, image.height);
    
    // Draw black pixels where this color appears
    ctx.fillStyle = '#000000';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    return canvas.toDataURL('image/png');
}

/**
 * Generate the OpenSCAD file that uses the masks
 */
function generateOpenSCADFile(image: PartListImage): string {
    const pixelSize = 2.5; // Size of each pixel in mm
    const height = 2.0; // Height extrusion in mm
    
    let scad = `// Generated OpenSCAD file for pixel art
// Image size: ${image.width}x${image.height} pixels
// Pixel size: ${pixelSize}mm
// Height: ${height}mm

$fn = 20; // Resolution for curves

`;
    
    // Add a module for each color
    image.partList.forEach((part, index) => {
        const colorName = sanitizeFilename(nameOfColor(part.target));
        const colorHex = colorEntryToHex(part.target);
        
        scad += `// ${part.target.name} (${colorHex})\n`;
        scad += `module layer_${index}_${colorName}() {\n`;
        scad += `    color("${colorHex}")\n`;
        scad += `    translate([0, 0, ${index * height}])\n`;
        scad += `    scale([${pixelSize}, ${pixelSize}, ${height}])\n`;
        scad += `    surface(file = "mask_${index}_${colorName}.png", center = false, invert = true);\n`;
        scad += `}\n\n`;
    });
    
    // Create the main assembly
    scad += `// Main assembly - uncomment to show all layers\n`;
    scad += `union() {\n`;
    image.partList.forEach((part, index) => {
        const colorName = sanitizeFilename(nameOfColor(part.target));
        scad += `    layer_${index}_${colorName}();\n`;
    });
    scad += `}\n`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
