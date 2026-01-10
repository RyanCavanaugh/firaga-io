import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

declare const JSZip: any;

export function exportOpenSCADMasks(image: PartListImage, filename: string): void {
    loadJSZipAnd(() => {
        const zip = new JSZip();
        
        // Generate mask images for each color
        const imageFiles: string[] = [];
        image.partList.forEach((part, index) => {
            const maskImage = generateMaskImage(image, index);
            const imageName = `mask_${index}_${sanitizeFilename(part.target.name)}.png`;
            imageFiles.push(imageName);
            
            // Convert canvas to blob and add to zip
            const dataUrl = maskImage.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];
            zip.file(imageName, base64Data, { base64: true });
        });
        
        // Generate OpenSCAD file
        const scadContent = generateOpenSCADFile(image, imageFiles);
        zip.file(`${filename}.scad`, scadContent);
        
        // Generate and download zip
        zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
            downloadFile(blob, `${filename}_openscad.zip`);
        });
    });
}

function generateMaskImage(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    // Fill with white (255) where the color matches, black (0) otherwise
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelIndex = (y * image.width + x) * 4;
            const isMatch = image.pixels[y][x] === colorIndex;
            const value = isMatch ? 255 : 0;
            
            imageData.data[pixelIndex] = value;     // R
            imageData.data[pixelIndex + 1] = value; // G
            imageData.data[pixelIndex + 2] = value; // B
            imageData.data[pixelIndex + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function generateOpenSCADFile(image: PartListImage, imageFiles: string[]): string {
    const voxelSize = 1.0; // Size of each voxel in mm
    const baseHeight = 0.5; // Base layer height
    const colorHeight = 1.5; // Height per color layer
    
    let scadCode = `// Generated OpenSCAD file for ${image.width}x${image.height} image
// Each color layer is rendered from a heightmap mask

`;
    
    // Add color information as comments
    scadCode += `// Colors:\n`;
    image.partList.forEach((part, index) => {
        const hex = colorEntryToHex(part.target);
        scadCode += `// ${index}: ${part.target.name} (${hex}) - ${part.count} pixels\n`;
    });
    
    scadCode += `\n`;
    scadCode += `voxel_size = ${voxelSize};\n`;
    scadCode += `base_height = ${baseHeight};\n`;
    scadCode += `color_height = ${colorHeight};\n`;
    scadCode += `image_width = ${image.width};\n`;
    scadCode += `image_height = ${image.height};\n\n`;
    
    scadCode += `// Helper module to create a layer from heightmap\n`;
    scadCode += `module heightmap_layer(image_file, layer_height, color_rgb) {\n`;
    scadCode += `    color(color_rgb)\n`;
    scadCode += `    scale([voxel_size, voxel_size, layer_height])\n`;
    scadCode += `    surface(file = image_file, center = true, invert = false);\n`;
    scadCode += `}\n\n`;
    
    scadCode += `// Combine all color layers\n`;
    scadCode += `union() {\n`;
    
    // Add each color layer
    image.partList.forEach((part, index) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        scadCode += `    // ${part.target.name}\n`;
        scadCode += `    heightmap_layer("${imageFiles[index]}", color_height, [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);\n\n`;
    });
    
    scadCode += `}\n`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadJSZipAnd(callback: () => void): void {
    const tagName = 'jszip-script-tag';
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        const tag = document.createElement('script');
        tag.id = tagName;
        tag.onload = () => {
            callback();
        };
        tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(tag);
    } else {
        callback();
    }
}
