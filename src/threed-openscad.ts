import JSZip from 'jszip';
import { PartListImage } from "./image-utils";

export async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    const zip = new JSZip();
    
    // Generate one monochrome image per color
    const imageFiles: string[] = [];
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const imageName = `color_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        imageFiles.push(imageName);
        
        const imageData = createMaskImage(image, colorIndex);
        const blob = await canvasToBlob(imageData);
        zip.file(imageName, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate ZIP and download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${filename}_openscad_masks.zip`);
}

function createMaskImage(image: PartListImage, colorIndex: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    // Fill with black/white based on whether pixel matches this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isMatch = image.pixels[y][x] === colorIndex;
            const value = isMatch ? 255 : 0; // White for filled, black for empty
            
            imageData.data[idx + 0] = value; // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A (fully opaque)
        }
    }
    
    return imageData;
}

async function canvasToBlob(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve, reject) => {
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
    const colorDefs = image.partList.map((color, idx) => {
        const r = (color.target.r / 255).toFixed(3);
        const g = (color.target.g / 255).toFixed(3);
        const b = (color.target.b / 255).toFixed(3);
        return `color_${idx} = [${r}, ${g}, ${b}];`;
    }).join('\n');
    
    const heightmapModules = image.partList.map((color, idx) => {
        return `module color_${idx}_layer() {
    color(color_${idx})
    scale([1, 1, layer_height])
    surface(file = "${imageFiles[idx]}", center = true, invert = false);
}`;
    }).join('\n\n');
    
    const layerCalls = image.partList.map((color, idx) => {
        return `translate([0, 0, ${idx} * layer_height]) color_${idx}_layer();`;
    }).join('\n    ');
    
    return `// Generated OpenSCAD file for 3D visualization
// Image dimensions: ${image.width} x ${image.height}

// Configuration
layer_height = 1; // Height of each color layer

// Color definitions
${colorDefs}

// Heightmap modules for each color
${heightmapModules}

// Assemble all layers
module display_image() {
    ${layerCalls}
}

// Render the complete image
display_image();
`;
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
