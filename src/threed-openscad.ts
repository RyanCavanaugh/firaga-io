import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';

/**
 * Generates an OpenSCAD masks package from a PartListImage.
 * Creates a ZIP file containing:
 * - One monochrome image per color (black pixels = filled, white = empty)
 * - An OpenSCAD .scad file that uses heightmap to combine them into a 3D model
 */
export function generateOpenSCADMasks(image: PartListImage, filename: string): void {
    generateMasksPackage(image, filename);
}

async function generateMasksPackage(image: PartListImage, filename: string): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const maskFiles: string[] = [];
    const colorNames: string[] = [];
    
    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const maskFilename = `mask_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        maskFiles.push(maskFilename);
        colorNames.push(entry.target.name);
        
        const maskImageData = createMaskImage(image, colorIdx);
        const blob = await canvasToBlob(maskImageData);
        zip.file(maskFilename, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(maskFiles, colorNames, image.width, image.height);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate README
    const readme = generateReadme(filename, maskFiles, colorNames);
    zip.file('README.txt', readme);
    
    // Download the ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

function createMaskImage(image: PartListImage, colorIdx: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(image.width, image.height);
    
    // Fill with white (255, 255, 255, 255)
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;     // R
        imageData.data[i + 1] = 255; // G
        imageData.data[i + 2] = 255; // B
        imageData.data[i + 3] = 255; // A
    }
    
    // Mark pixels of this color as black (0, 0, 0, 255)
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                const idx = (y * image.width + x) * 4;
                imageData.data[idx] = 0;     // R
                imageData.data[idx + 1] = 0; // G
                imageData.data[idx + 2] = 0; // B
                imageData.data[idx + 3] = 255; // A
            }
        }
    }
    
    return imageData;
}

function canvasToBlob(imageData: ImageData): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob from canvas'));
            }
        }, 'image/png');
    });
}

function generateOpenSCADFile(maskFiles: string[], colorNames: string[], width: number, height: number): string {
    const pixelSize = 1.0; // Size of each pixel in mm
    const heightPerLayer = 0.5; // Height of each color layer in mm
    
    let scadCode = `// OpenSCAD 3D Model Generator
// Generated from pixel art image
// Image dimensions: ${width} x ${height} pixels

// Parameters
pixel_size = ${pixelSize}; // Size of each pixel in mm
height_per_layer = ${heightPerLayer}; // Height of each color layer in mm
base_thickness = 0.2; // Base plate thickness in mm

// Image dimensions
img_width = ${width};
img_height = ${height};

module color_layer(mask_file, layer_height, color_name) {
    color(color_name)
    linear_extrude(height = layer_height)
    scale([pixel_size, pixel_size, 1])
    surface(file = mask_file, center = false, invert = true);
}

// Main model
union() {
    // Base plate
    color("gray")
    cube([img_width * pixel_size, img_height * pixel_size, base_thickness]);
    
    // Color layers
`;
    
    maskFiles.forEach((maskFile, idx) => {
        const colorName = colorNames[idx] ?? 'color';
        const zOffset = 'base_thickness';
        scadCode += `    translate([0, 0, ${zOffset}])\n`;
        scadCode += `        color_layer("${maskFile}", height_per_layer, "${escapeScadString(colorName)}");\n`;
        scadCode += `    \n`;
    });
    
    scadCode += `}
`;
    
    return scadCode;
}

function generateReadme(filename: string, maskFiles: string[], colorNames: string[]): string {
    return `OpenSCAD 3D Model Package for "${filename}"

This package contains:
1. ${filename}.scad - The main OpenSCAD file
2. ${maskFiles.length} mask images (one per color):
${maskFiles.map((file, idx) => `   - ${file} (${colorNames[idx]})`).join('\n')}

How to use:
1. Extract all files to a folder
2. Open ${filename}.scad in OpenSCAD
3. Render the model (F6)
4. Export to STL or other 3D format (File > Export)

The mask images are black and white PNG files where:
- Black pixels indicate where that color should appear
- White pixels are empty/transparent for that color

You can modify the parameters in the .scad file to adjust:
- pixel_size: Physical size of each pixel
- height_per_layer: Thickness of each color layer
- base_thickness: Thickness of the base plate

Generated by firaga.io
`;
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-z0-9_\-]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

function escapeScadString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function loadJSZip(): Promise<typeof import('jszip')> {
    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('jszip-script');
        if (existingScript) {
            resolve((window as any).JSZip);
            return;
        }
        
        const script = document.createElement('script');
        script.id = 'jszip-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
