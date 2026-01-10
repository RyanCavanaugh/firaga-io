import { PartListImage } from './image-utils';

declare const JSZip: any;

export type ExportOpenSCADSettings = {
    filename: string;
    height: number; // Height of each layer in mm
};

/**
 * Exports a PartListImage as a zip file containing:
 * - One black/white PNG per color (heightmap masks)
 * - An OpenSCAD file that combines them into a 3D display
 */
export async function exportOpenSCADMasks(image: PartListImage, settings: ExportOpenSCADSettings) {
    await loadJSZipAnd(() => exportOpenSCADMasksWorker(image, settings));
}

async function loadJSZipAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}

async function exportOpenSCADMasksWorker(image: PartListImage, settings: ExportOpenSCADSettings) {
    const { filename, height } = settings;
    const zip = new JSZip();
    
    // Generate one mask image per color
    const imageFiles: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImageData = createMaskImage(image, i);
        const imageName = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        
        // Convert ImageData to PNG blob
        const blob = await imageDataToBlob(maskImageData);
        zip.file(imageName, blob);
        imageFiles.push(imageName);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles, height);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${filename}_openscad.zip`);
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Creates a black/white mask image for a specific color index
 * White pixels = color is present, Black pixels = color is absent
 */
function createMaskImage(image: PartListImage, colorIndex: number): ImageData {
    const imageData = new ImageData(image.width, image.height);
    const data = imageData.data;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const i = (y * image.width + x) * 4;
            const pixelColorIndex = image.pixels[y][x];
            
            // White (255) where this color is present, black (0) otherwise
            const value = pixelColorIndex === colorIndex ? 255 : 0;
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            data[i + 3] = 255;   // A (fully opaque)
        }
    }
    
    return imageData;
}

/**
 * Generates the OpenSCAD file content
 */
function generateOpenSCADFile(image: PartListImage, imageFiles: string[], layerHeight: number): string {
    const pixelSize = 1.0; // 1mm per pixel
    const layers: string[] = [];
    
    image.partList.forEach((part, index) => {
        const imageName = imageFiles[index];
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        layers.push(`// ${part.target.name} (${part.count} pixels)
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${index * layerHeight}])
scale([${pixelSize}, ${pixelSize}, ${layerHeight}])
surface(file = "${imageName}", center = false, invert = false);
`);
    });
    
    return `// Generated OpenSCAD file for pixel art display
// Image dimensions: ${image.width}x${image.height} pixels
// Pixel size: ${pixelSize}mm
// Layer height: ${layerHeight}mm
// Total colors: ${image.partList.length}

// Each color is a separate layer using heightmap from mask images
// White pixels in mask = height 1, black pixels = height 0

union() {
${layers.join('\n')}
}
`;
}

/**
 * Converts ImageData to a PNG blob
 */
async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
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

/**
 * Sanitizes a filename by removing invalid characters
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
