import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';
import { saveAs } from 'file-saver';

declare const JSZip: any;

export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    // Load JSZip dynamically if needed
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create a monochrome image for each color
    image.partList.forEach((part, partIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelIndex = image.pixels[y][x];
                if (pixelIndex === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(`mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate the zip file and download
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, `${filename}_openscad.zip`);
    });
}

function generateOpenSCADFile(image: PartListImage): string {
    const pixelSize = 1.0; // Size of each pixel in mm
    const height = 2.0; // Height of the heightmap
    
    let scadCode = `// Generated OpenSCAD file for ${image.width}x${image.height} image
// Each color layer is loaded from a separate heightmap

`;
    
    // Add each color as a separate heightmap-based extrusion
    image.partList.forEach((part, index) => {
        const colorHex = colorEntryToHex(part.target);
        const filename = `mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`;
        
        scadCode += `// ${part.target.name} (${colorHex})
color("${colorHex}")
translate([0, 0, ${index * 0.1}]) // Slight Z offset to prevent Z-fighting
surface(file = "${filename}", center = true, invert = true);

`;
    });
    
    scadCode += `
// Alternative: Combine all layers into a single object
// union() {
`;
    
    image.partList.forEach((part, index) => {
        const colorHex = colorEntryToHex(part.target);
        const filename = `mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`;
        
        scadCode += `//   color("${colorHex}")
//   surface(file = "${filename}", center = true, invert = true);
`;
    });
    
    scadCode += `// }
`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve(undefined);
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
