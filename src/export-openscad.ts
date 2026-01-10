import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ExportOpenSCADSettings {
    pitch: number;
    height: number; // Height/depth of each pixel in mm
}

export async function exportOpenSCADMasks(image: PartListImage, settings: ExportOpenSCADSettings) {
    const { partList } = image;
    
    // Load JSZip
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one mask image per color
    const imageFiles: string[] = [];
    for (let i = 0; i < partList.length; i++) {
        const maskData = generateMaskForColor(image, i);
        const filename = `mask_${i}_${sanitizeFilename(partList[i].target.name)}.png`;
        zip.file(filename, maskData, { base64: true });
        imageFiles.push(filename);
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings, imageFiles);
    zip.file("model.scad", scadContent);

    // Generate README
    const readmeContent = generateReadme(image, settings);
    zip.file("README.txt", readmeContent);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_masks.zip");
}

function generateMaskForColor(image: PartListImage, colorIndex: number): string {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, image.width, image.height);

    // Draw black pixels where this color appears
    ctx.fillStyle = "black";
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // Convert to base64 PNG
    const dataURL = canvas.toDataURL("image/png");
    // Remove the "data:image/png;base64," prefix
    return dataURL.split(",")[1];
}

function generateOpenSCADFile(image: PartListImage, settings: ExportOpenSCADSettings, imageFiles: string[]): string {
    const { pitch, height: pixelHeight } = settings;
    const { width, height, partList } = image;

    let scad = `// Generated OpenSCAD model for pixel art
// Image size: ${width} x ${height} pixels
// Pixel pitch: ${pitch} mm
// Pixel height: ${pixelHeight} mm

`;

    // Add color definitions as comments
    scad += `// Color legend:\n`;
    partList.forEach((part, idx) => {
        scad += `// ${idx}: ${part.target.name} (${colorEntryToHex(part.target)}) - ${part.count} pixels\n`;
    });

    scad += `\n// Parameters
pixel_pitch = ${pitch};
pixel_height = ${pixelHeight};
image_width = ${width};
image_height = ${height};

// Module to create a heightmap layer from an image
module heightmap_layer(image_file, color) {
    color(color)
    scale([pixel_pitch, pixel_pitch, pixel_height])
    surface(file = image_file, center = true, invert = true);
}

// Combine all layers
union() {
`;

    // Add each color layer
    partList.forEach((part, idx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        scad += `    // Layer ${idx}: ${part.target.name}\n`;
        scad += `    heightmap_layer("${imageFiles[idx]}", [${r}, ${g}, ${b}]);\n`;
        scad += `\n`;
    });

    scad += `}
`;

    return scad;
}

function generateReadme(image: PartListImage, settings: ExportOpenSCADSettings): string {
    return `OpenSCAD Heightmap Export
==========================

This archive contains:
- model.scad: The main OpenSCAD file
- mask_*.png: One black/white mask image per color
- README.txt: This file

To use:
1. Extract all files to the same directory
2. Open model.scad in OpenSCAD
3. Press F5 to preview or F6 to render
4. Export to STL for 3D printing

Image Information:
- Size: ${image.width} x ${image.height} pixels
- Colors: ${image.partList.length}
- Total pixels: ${image.partList.reduce((sum, p) => sum + p.count, 0)}
- Pixel pitch: ${settings.pitch} mm
- Pixel height: ${settings.height} mm

Physical dimensions:
- Width: ${(image.width * settings.pitch).toFixed(1)} mm
- Height: ${(image.height * settings.pitch).toFixed(1)} mm
- Depth: ${settings.height} mm

Color Legend:
${image.partList.map((part, idx) => `${idx + 1}. ${part.target.name} - ${part.count} pixels`).join('\n')}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
}

async function loadJSZip(): Promise<any> {
    if (!(window as any).JSZip) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load JSZip"));
            document.head.appendChild(script);
        });
    }
    return (window as any).JSZip;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
