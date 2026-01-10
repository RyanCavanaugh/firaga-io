import { PartListImage } from "./image-utils";

declare const JSZip: typeof import("jszip");

export interface OpenSCADSettings {
    pitch: number;
    height: number;
    filename: string;
}

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings): Promise<Blob> {
    // Load JSZip if not already loaded
    await loadJSZip();
    
    const zip = new JSZip();
    const { pitch, height } = settings;
    
    // Generate one PNG mask per color
    const colorFiles: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
        colorFiles.push(filename);
        
        const maskData = generateMaskImage(image, i);
        zip.file(filename, maskData);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateSCADFile(image, settings, colorFiles);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    return await zip.generateAsync({ type: "blob" });
}

function generateMaskImage(image: PartListImage, colorIndex: number): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob synchronously using data URL
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: 'image/png' });
}

function generateSCADFile(image: PartListImage, settings: OpenSCADSettings, colorFiles: string[]): string {
    const { pitch, height } = settings;
    
    let scad = `// Generated OpenSCAD file for ${settings.filename}
// Image dimensions: ${image.width}x${image.height}
// Pitch: ${pitch}mm, Height: ${height}mm

`;
    
    // Add color definitions
    scad += `// Color definitions\n`;
    image.partList.forEach((part, idx) => {
        scad += `color_${idx} = [${part.target.r / 255}, ${part.target.g / 255}, ${part.target.b / 255}]; // ${part.target.name}\n`;
    });
    scad += '\n';
    
    // Add surface function for heightmap
    scad += `module layer_from_heightmap(filename, color_rgb, pitch, height) {
    color(color_rgb)
    scale([pitch, pitch, height])
    surface(file = filename, center = true, invert = true);
}

`;
    
    // Generate the main assembly
    scad += `// Main assembly\n`;
    scad += `union() {\n`;
    
    image.partList.forEach((part, idx) => {
        scad += `    translate([${image.width * pitch / 2}, ${image.height * pitch / 2}, 0])\n`;
        scad += `        layer_from_heightmap("${colorFiles[idx]}", color_${idx}, ${pitch}, ${height});\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error("Failed to load JSZip"));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

export async function downloadOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings): Promise<void> {
    const blob = await generateOpenSCADMasks(image, settings);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.filename}_openscad.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
