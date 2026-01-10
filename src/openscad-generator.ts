import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface OpenSCADSettings {
    pitch: number;
    height: number; // Height per layer in mm
}

export async function makeOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings) {
    await loadJSZip();
    const zip = new JSZip();
    
    const { pitch, height } = settings;
    
    // Create one monochrome image per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        // Sanitize filename
        const safeName = color.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${colorIndex}_${safeName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('display.scad', scadContent);
    
    // Generate zip file and download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, 'openscad-masks.zip');
}

function generateOpenSCADFile(image: PartListImage, settings: OpenSCADSettings): string {
    const { pitch, height } = settings;
    const lines: string[] = [];
    
    lines.push('// Generated OpenSCAD file for 3D pixel art display');
    lines.push('// Each color is loaded as a heightmap and combined');
    lines.push('');
    lines.push(`pixel_pitch = ${pitch}; // mm`);
    lines.push(`layer_height = ${height}; // mm`);
    lines.push(`image_width = ${image.width};`);
    lines.push(`image_height = ${image.height};`);
    lines.push('');
    
    lines.push('// Function to create a layer from a mask image');
    lines.push('module create_layer(filename, color_rgb) {');
    lines.push('    color(color_rgb)');
    lines.push('    scale([pixel_pitch, pixel_pitch, layer_height])');
    lines.push('    surface(file = filename, center = true, invert = true);');
    lines.push('}');
    lines.push('');
    
    lines.push('// Combine all layers');
    lines.push('union() {');
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const safeName = color.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        lines.push(`    // ${color.target.name}`);
        lines.push(`    translate([0, 0, ${colorIndex * height}])`);
        lines.push(`    create_layer("mask_${colorIndex}_${safeName}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);`);
        lines.push('');
    }
    
    lines.push('}');
    
    return lines.join('\n');
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

function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
