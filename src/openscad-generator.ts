import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export interface OpenSCADMasksSettings {
    pitch: number;
    height: number;
    filename: string;
}

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADMasksSettings) {
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    
    // Create a black/white PNG for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const imageData = createMaskImageData(image, colorIdx);
        const pngBlob = await imageDataToPNG(imageData);
        const filename = sanitizeFilename(part.target.name) + '.png';
        zip.file(filename, pngBlob);
    }
    
    // Create the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    // Generate and download the zip
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function createMaskImageData(image: PartListImage, colorIdx: number): ImageData {
    const { width, height, pixels } = image;
    const imageData = new ImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isColor = pixels[y][x] === colorIdx;
            
            // White for the color, black for everything else
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A (opaque)
        }
    }
    
    return imageData;
}

async function imageDataToPNG(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create PNG blob'));
            }
        }, 'image/png');
    });
}

function sanitizeFilename(name: string): string {
    // Remove or replace characters that are problematic in filenames
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

function generateOpenSCADFile(image: PartListImage, settings: OpenSCADMasksSettings): string {
    const { width, height, partList } = image;
    const { pitch, height: layerHeight } = settings;
    
    let scad = '// Generated OpenSCAD file for pixel art visualization\n';
    scad += '// Import and combine heightmap images for each color\n\n';
    
    scad += `// Image dimensions\n`;
    scad += `width = ${width};\n`;
    scad += `height = ${height};\n`;
    scad += `pixel_size = ${pitch};\n`;
    scad += `layer_height = ${layerHeight};\n\n`;
    
    scad += `// Scale factor to convert image coordinates to 3D space\n`;
    scad += `scale_x = width * pixel_size / 100;\n`;
    scad += `scale_y = height * pixel_size / 100;\n\n`;
    
    scad += `union() {\n`;
    
    partList.forEach((part, idx) => {
        const filename = sanitizeFilename(part.target.name) + '.png';
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        scad += `  // Color: ${part.target.name} (${hex})\n`;
        scad += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scad += `  translate([0, 0, ${(idx * 0.01).toFixed(3)}])  // Slight z-offset to prevent z-fighting\n`;
        scad += `  scale([scale_x, scale_y, layer_height])\n`;
        scad += `  surface(file = "${filename}", center = true, invert = false);\n\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}
