import { PartListImage } from './image-utils';
// @ts-ignore
import * as FileSaver from 'file-saver';

declare const JSZip: any;

/**
 * Generates an OpenSCAD masks format - a zip file containing:
 * - One monochrome PNG image per color (heightmap mask)
 * - An OpenSCAD .scad file that loads and combines them
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    // Dynamically import JSZip
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const imagePromises: Promise<void>[] = [];

    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const maskBlob = createMaskImage(image, colorIdx);
        const sanitizedName = sanitizeFilename(entry.target.name);
        const imageName = `mask_${colorIdx}_${sanitizedName}.png`;
        
        imagePromises.push(
            maskBlob.arrayBuffer().then(buffer => {
                zip.file(imageName, buffer);
            })
        );
    }

    await Promise.all(imagePromises);

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file('display.scad', scadContent);

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipBlob, `${filename}_openscad.zip`);
}

function createMaskImage(image: PartListImage, colorIdx: number): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.createImageData(image.width, image.height);
    
    // Create black/white mask - white where this color exists, black elsewhere
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelColorIdx = image.pixels[y][x];
            const value = pixelColorIdx === colorIdx ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                throw new Error('Failed to create blob from canvas');
            }
        }, 'image/png');
    }) as any;
}

function generateOpenSCADFile(image: PartListImage): string {
    const layerHeight = 2.5;
    const baseZ = 0;
    
    let scadCode = `// Generated OpenSCAD file for ${image.width}x${image.height} image
// Each color layer is offset vertically to create a 3D effect

`;

    // Add modules for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const sanitizedName = sanitizeFilename(entry.target.name);
        const imageName = `mask_${colorIdx}_${sanitizedName}.png`;
        const zOffset = baseZ + (colorIdx * layerHeight);
        const { r, g, b } = entry.target;
        
        scadCode += `// Layer ${colorIdx}: ${entry.target.name}
color([${r / 255}, ${g / 255}, ${b / 255}])
translate([0, 0, ${zOffset}])
surface(file = "${imageName}", center = true, invert = false);

`;
    }

    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

async function loadJSZip(): Promise<any> {
    // Check if JSZip is already loaded
    if (typeof (window as any).JSZip !== 'undefined') {
        return (window as any).JSZip;
    }
    
    // Dynamically load JSZip
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = () => {
            reject(new Error('Failed to load JSZip'));
        };
        document.head.appendChild(script);
    });
}
