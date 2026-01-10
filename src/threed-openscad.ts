import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

/**
 * Generate a ZIP file with OpenSCAD masks
 * - One black/white PNG per color
 * - One .scad file that combines them
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    const zip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const JSZip = zip.default;
    
    const archive = new JSZip();
    
    // Generate a mask image for each color
    const imageFiles: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImageData = generateMaskImage(image, i);
        const blob = await imageDataToBlob(maskImageData);
        
        const imageName = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        archive.file(imageName, blob);
        imageFiles.push(imageName);
    }
    
    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles);
    archive.file('model.scad', scadContent);
    
    // Generate a README
    const readme = `# OpenSCAD 3D Model

This archive contains:
- ${imageFiles.length} mask image(s) (one per color)
- model.scad - OpenSCAD file to generate the 3D model

## Usage

1. Open model.scad in OpenSCAD
2. Press F5 to preview or F6 to render
3. Export as STL for 3D printing

## Parameters

You can adjust the following parameters in model.scad:
- pixel_size: Size of each pixel (default: 1mm)
- base_height: Height of each layer (default: 0.5mm)
- layer_spacing: Spacing between layers (default: 0.1mm)
`;
    archive.file('README.md', readme);
    
    // Generate and save the zip file
    const blob = await archive.generateAsync({ type: 'blob' });
    saveAs(blob, filename.replace(/\.png$/, '') + '_openscad.zip');
}

function generateMaskImage(image: PartListImage, colorIndex: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColorMatch = image.pixels[y][x] === colorIndex;
            
            // White for matching pixels, black for others
            const value = isColorMatch ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    return imageData;
}

async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
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
                reject(new Error('Failed to create blob from canvas'));
            }
        }, 'image/png');
    });
}

function generateOpenSCADFile(image: PartListImage, imageFiles: string[]): string {
    const colors = image.partList.map(part => {
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        return `[${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]`;
    });
    
    let scadContent = `// Generated OpenSCAD model
// Image dimensions: ${image.width}x${image.height}

// Parameters
pixel_size = 1;        // Size of each pixel in mm
base_height = 0.5;     // Height of each color layer in mm
layer_spacing = 0.1;   // Spacing between layers in mm

// Image dimensions
img_width = ${image.width};
img_height = ${image.height};

`;
    
    // Add modules for each color layer
    imageFiles.forEach((filename, index) => {
        const colorName = sanitizeModuleName(image.partList[index].target.name);
        const color = colors[index];
        
        scadContent += `// Layer ${index + 1}: ${image.partList[index].target.name}
module layer_${index}_${colorName}() {
    color(${color})
    translate([0, 0, ${index} * (base_height + layer_spacing)])
    scale([pixel_size, pixel_size, base_height])
    surface(file = "${filename}", center = true, invert = true);
}

`;
    });
    
    // Combine all layers
    scadContent += `// Combine all layers
union() {
`;
    
    imageFiles.forEach((_, index) => {
        const colorName = sanitizeModuleName(image.partList[index].target.name);
        scadContent += `    layer_${index}_${colorName}();\n`;
    });
    
    scadContent += `}\n`;
    
    return scadContent;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function sanitizeModuleName(name: string): string {
    // OpenSCAD module names: alphanumeric and underscore only
    return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase().replace(/^(\d)/, '_$1');
}
