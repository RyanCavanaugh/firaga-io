import { PartListImage } from "./image-utils";

declare const JSZip: any;

export interface ExportOpenSCADSettings {
    pixelSize: number;
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export async function exportOpenSCADMasks(image: PartListImage, settings: ExportOpenSCADSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate one mask image per color
    const imagePromises: Promise<void>[] = [];
    const colorFiles: string[] = [];
    
    for (let i = 0; i < image.partList.length; i++) {
        const entry = image.partList[i];
        const filename = `color_${i}_${sanitizeFilename(entry.target.name)}.png`;
        colorFiles.push(filename);
        
        const promise = generateMaskForColor(image, i).then((blob: Blob) => {
            zip.file(filename, blob);
        });
        imagePromises.push(promise);
    }
    
    await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings, colorFiles);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate the zip file and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(`${settings.filename}_openscad.zip`, blob);
}

function generateMaskForColor(image: PartListImage, colorIdx: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Create image data (black and white)
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColorPixel = image.pixels[y][x] === colorIdx;
            const value = isColorPixel ? 255 : 0; // white for color, black for empty
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob: Blob | null) => {
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
    settings: ExportOpenSCADSettings,
    colorFiles: string[]
): string {
    const { pixelSize, pixelHeight, baseHeight } = settings;
    
    let scadCode = `// Generated OpenSCAD file for pixel art 3D model
// Image size: ${image.width}x${image.height} pixels
// Pixel size: ${pixelSize}mm
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

`;
    
    // Add union of all color layers
    scadCode += `union() {\n`;
    
    // Add base layer
    scadCode += `  // Base layer\n`;
    scadCode += `  color([0.5, 0.5, 0.5])\n`;
    scadCode += `  translate([0, 0, 0])\n`;
    scadCode += `  cube([${image.width * pixelSize}, ${image.height * pixelSize}, ${baseHeight}]);\n\n`;
    
    // Add each color layer
    for (let i = 0; i < image.partList.length; i++) {
        const entry = image.partList[i];
        const color = entry.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadCode += `  // ${entry.target.name} (${entry.count} pixels)\n`;
        scadCode += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadCode += `  translate([0, 0, ${baseHeight}])\n`;
        scadCode += `  scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])\n`;
        scadCode += `  surface(file = "${colorFiles[i]}", center = false, invert = true);\n\n`;
    }
    
    scadCode += `}\n`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadBlob(filename: string, blob: Blob): void {
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
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
