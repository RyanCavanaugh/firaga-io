import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const JSZip: any;

export async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    const width = image.width;
    const height = image.height;
    
    // Generate one black/white image per color
    const imageFiles: string[] = [];
    
    image.partList.forEach((part, colorIndex) => {
        const imageName = `color_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        imageFiles.push(imageName);
        
        // Create canvas for this color mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = '#000000';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob and add to zip
        canvas.toBlob((blob) => {
            if (blob) {
                zip.file(imageName, blob);
            }
        }, 'image/png');
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles, width, height);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate the zip file
    setTimeout(async () => {
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${filename}_openscad.zip`);
    }, 500); // Wait for canvas blobs to be added
}

function generateOpenSCADFile(
    image: PartListImage, 
    imageFiles: string[], 
    width: number, 
    height: number
): string {
    const layers: string[] = [];
    
    image.partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target);
        const rgbValues = hexToRgb(hex);
        const imageName = imageFiles[colorIndex];
        
        layers.push(`  // Layer ${colorIndex}: ${part.target.name} (${hex})
  color([${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}])
  translate([0, 0, ${colorIndex}])
  surface(file = "${imageName}", center = true, invert = true);`);
    });
    
    const scadFile = `// Generated OpenSCAD file for ${image.partList.length} colors
// Image dimensions: ${width} x ${height}

// Each color is a separate layer using heightmap from PNG
// Black pixels in PNG = raised, White pixels = lowered

$fn = 30; // Resolution

${layers.join('\n\n')}
`;
    
    return scadFile;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        
        if (scriptEl !== null || typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => resolve();
        tag.onerror = () => reject(new Error('Failed to load JSZip'));
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    });
}
