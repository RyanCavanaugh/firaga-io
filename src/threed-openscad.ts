import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const JSZip: any;

export async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    const images: Array<{ name: string; color: string }> = [];
    
    // Generate one monochrome PNG per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const maskData = createColorMask(image, colorIndex);
        const pngBlob = await canvasToPNGBlob(maskData);
        const safeName = sanitizeFilename(part.target.name);
        const imageName = `mask_${colorIndex}_${safeName}.png`;
        zip.file(imageName, pngBlob);
        images.push({ name: imageName, color: colorEntryToHex(part.target) });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(images, image.width, image.height);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${filename}_openscad.zip`);
}

function createColorMask(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, image.width, image.height);
    
    // Set black pixels where this color exists
    ctx.fillStyle = '#000000';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    return canvas;
}

function canvasToPNGBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/png');
    });
}

function generateOpenSCADFile(images: Array<{ name: string; color: string }>, width: number, height: number): string {
    const voxelSize = 1.0;
    const heightScale = 1.0;
    
    const modules = images.map((img, i) => `
module layer_${i}() {
    color("${img.color}")
    scale([${voxelSize}, ${voxelSize}, ${heightScale}])
    surface(file = "${img.name}", center = true, invert = true);
}`).join('\n');
    
    const calls = images.map((_, i) => `layer_${i}();`).join('\n');
    
    return `// Generated OpenSCAD file for ${width}x${height} pixel art
// Each color layer is loaded from a heightmap image
// Black pixels in the image become raised areas

// Adjust these parameters as needed
voxel_size = ${voxelSize};
height_scale = ${heightScale};

${modules}

// Combine all layers
union() {
${calls.split('\n').map(line => '    ' + line).join('\n')}
}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
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

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl !== null) {
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
