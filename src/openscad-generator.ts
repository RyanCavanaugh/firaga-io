import { PartListImage } from "./image-utils";

export interface OpenSCADSettings {
    pixelHeight: number; // Height of each pixel in mm
    pitch: number; // Spacing between pixels in mm
}

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings): Promise<Blob> {
    const { pixelHeight, pitch } = settings;
    
    // Use JSZip for creating the zip file
    await loadJSZip();
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();
    
    // Create a monochrome image for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const imageData = createMaskImage(image, colorIdx);
        
        // Convert canvas to blob
        const blob = await canvasToBlob(imageData);
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
    }
    
    // Create the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);
    
    // Create README
    const readme = generateReadme(image, settings);
    zip.file("README.txt", readme);
    
    return await zip.generateAsync({ type: "blob" });
}

function createMaskImage(image: PartListImage, colorIdx: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black pixels where this color appears
    ctx.fillStyle = "black";
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob from canvas"));
            }
        }, "image/png");
    });
}

function generateOpenSCADFile(image: PartListImage, settings: OpenSCADSettings): string {
    const { pixelHeight, pitch } = settings;
    
    let scad = `// OpenSCAD model generated from firaga.io
// Image size: ${image.width} x ${image.height} pixels
// Pixel pitch: ${pitch} mm
// Pixel height: ${pixelHeight} mm

// Total dimensions
width = ${image.width * pitch};
height = ${image.height * pitch};
pixel_size = ${pitch};
pixel_height = ${pixelHeight};

`;
    
    // Add color definitions
    image.partList.forEach((part, idx) => {
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        scad += `color_${idx} = [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]; // ${part.target.name}\n`;
    });
    
    scad += `\n// Module to create a heightmap layer from an image\n`;
    scad += `module layer(image_file, pixel_height, color_value) {\n`;
    scad += `    color(color_value)\n`;
    scad += `    scale([pixel_size, pixel_size, pixel_height])\n`;
    scad += `    surface(file=image_file, center=true, invert=true);\n`;
    scad += `}\n\n`;
    
    scad += `// Combine all layers\n`;
    scad += `union() {\n`;
    
    image.partList.forEach((part, idx) => {
        const filename = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        scad += `    // ${part.target.name}\n`;
        scad += `    translate([0, 0, 0])\n`;
        scad += `    layer("${filename}", pixel_height, color_${idx});\n\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function generateReadme(image: PartListImage, settings: OpenSCADSettings): string {
    let readme = `OpenSCAD Masks Export from firaga.io
=====================================

This archive contains:
- One monochrome PNG image per color (black pixels = where that color appears)
- model.scad - OpenSCAD file that combines all masks into a 3D model

Image Information:
- Size: ${image.width} x ${image.height} pixels
- Pixel pitch: ${settings.pitch} mm
- Pixel height: ${settings.pixelHeight} mm
- Total dimensions: ${(image.width * settings.pitch).toFixed(1)} x ${(image.height * settings.pitch).toFixed(1)} mm

Colors Used:
`;
    
    image.partList.forEach((part, idx) => {
        readme += `${idx + 1}. ${part.target.name}`;
        if (part.target.code) {
            readme += ` (${part.target.code})`;
        }
        readme += ` - ${part.count} pixels\n`;
    });
    
    readme += `\nHow to Use:
1. Open model.scad in OpenSCAD
2. Press F5 to preview or F6 to render
3. Export as STL or other 3D format

Note: The surface() function in OpenSCAD reads the brightness of each pixel
to determine the height. Black pixels (0) will be raised to the full height,
while white pixels (255) will be at height 0.
`;
    
    return readme;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<void> {
    if ((window as any).JSZip) {
        return;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        document.head.appendChild(script);
    });
}
