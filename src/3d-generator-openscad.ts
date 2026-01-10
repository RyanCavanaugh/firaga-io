import { PartListImage } from "./image-utils";
const JSZip = require("jszip");

export interface OpenSCADSettings {
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings) {
    const zip = new JSZip();
    
    // Create a monochrome PNG for each color
    const imagePromises: Promise<void>[] = [];
    
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const colorName = sanitizeFilename(part.target.name || `color_${partIdx}`);
        
        // Create canvas for this color mask
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`${colorName}.png`, blob);
                }
                resolve();
            });
        });
        
        imagePromises.push(promise);
    }
    
    // Wait for all images to be generated
    await Promise.all(imagePromises);
    
    // Create the OpenSCAD file
    const scadContent = createOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Create a README
    const readme = createReadme(image, settings);
    zip.file('README.txt', readme);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function createOpenSCADFile(image: PartListImage, settings: OpenSCADSettings): string {
    const { pixelHeight, baseHeight } = settings;
    const pixelSize = 1.0; // 1mm per pixel
    
    let scad = `// OpenSCAD 3D model generated from image\n`;
    scad += `// Image size: ${image.width} x ${image.height} pixels\n`;
    scad += `// Pixel size: ${pixelSize}mm\n`;
    scad += `// Base height: ${baseHeight}mm\n`;
    scad += `// Pixel height: ${pixelHeight}mm\n\n`;
    
    scad += `pixel_size = ${pixelSize};\n`;
    scad += `pixel_height = ${pixelHeight};\n`;
    scad += `base_height = ${baseHeight};\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;
    
    // Module to create extruded layer from heightmap
    scad += `module color_layer(filename, color_rgb, height) {\n`;
    scad += `  color(color_rgb)\n`;
    scad += `  translate([0, 0, base_height])\n`;
    scad += `  scale([pixel_size, pixel_size, height])\n`;
    scad += `  surface(file=filename, invert=true, center=false);\n`;
    scad += `}\n\n`;
    
    // Create base plate
    scad += `// Base plate\n`;
    scad += `color([0.8, 0.8, 0.8])\n`;
    scad += `cube([image_width * pixel_size, image_height * pixel_size, base_height]);\n\n`;
    
    // Add each color layer
    scad += `// Color layers\n`;
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const colorName = sanitizeFilename(part.target.name || `color_${partIdx}`);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scad += `color_layer("${colorName}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}], pixel_height);\n`;
    }
    
    return scad;
}

function createReadme(image: PartListImage, settings: OpenSCADSettings): string {
    let readme = `OpenSCAD 3D Model Files\n`;
    readme += `========================\n\n`;
    readme += `This archive contains:\n\n`;
    readme += `1. An OpenSCAD file (.scad) that defines the 3D model\n`;
    readme += `2. PNG mask files for each color layer\n\n`;
    readme += `To use:\n`;
    readme += `1. Extract all files to the same directory\n`;
    readme += `2. Open the .scad file in OpenSCAD\n`;
    readme += `3. Render the model (F6)\n`;
    readme += `4. Export as STL for 3D printing\n\n`;
    readme += `Color layers:\n`;
    
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const colorName = sanitizeFilename(part.target.name || `color_${partIdx}`);
        readme += `  - ${colorName}.png: ${part.target.name} (${part.count} pixels)\n`;
    }
    
    readme += `\nModel dimensions:\n`;
    readme += `  - Width: ${image.width}mm\n`;
    readme += `  - Height: ${image.height}mm\n`;
    readme += `  - Base: ${settings.baseHeight}mm\n`;
    readme += `  - Pixels: ${settings.pixelHeight}mm\n`;
    
    return readme;
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-z0-9_-]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
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
