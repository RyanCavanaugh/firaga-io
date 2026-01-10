import { PartListImage } from '../image-utils';

declare const JSZip: any;

/**
 * Generates a ZIP file containing monochrome masks and an OpenSCAD file
 */
export function generateOpenSCADMasks(image: PartListImage, filename: string): void {
    loadJSZipAndGenerate(image, filename);
}

async function loadJSZipAndGenerate(image: PartListImage, filename: string): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            generateZipFile(image, filename);
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        generateZipFile(image, filename);
    }
}

function generateZipFile(image: PartListImage, filename: string): void {
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    
    const imageFiles: string[] = [];
    
    // Generate one monochrome image per color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const imageName = `color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`;
        imageFiles.push(imageName);
        
        const imageData = createMonochromeMask(width, height, pixels, colorIdx);
        const dataURL = canvasToDataURL(imageData);
        
        // Extract base64 data from data URL
        const base64Data = dataURL.split(',')[1];
        zip.file(imageName, base64Data, { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles);
    zip.file(`${sanitizeFilename(filename)}.scad`, scadContent);
    
    // Generate and download ZIP
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFilename(filename)}_openscad.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function createMonochromeMask(
    width: number,
    height: number,
    pixels: ReadonlyArray<ReadonlyArray<number>>,
    colorIdx: number
): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
    
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isColor = pixels[y][x] === colorIdx;
            
            // White for the color, black for everything else
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    return imageData;
}

function canvasToDataURL(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

function generateOpenSCADFile(image: PartListImage, imageFiles: string[]): string {
    const { width, height, partList } = image;
    
    const colorModules: string[] = [];
    
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i];
        const imageName = imageFiles[i];
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        colorModules.push(`
// ${color.target.name} (${color.count} pixels)
module color_${i}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    surface(file = "${imageName}", center = true, invert = false);
}`);
    }
    
    const scadContent = `// OpenSCAD 3D visualization
// Image dimensions: ${width} x ${height}
// Generated from: ${image.partList.map(p => p.target.name).join(', ')}

pixel_height = 1.0; // Height multiplier for each pixel

${colorModules.join('\n')}

// Combine all colors with vertical offset
module display() {
    ${partList.map((_, i) => `translate([0, 0, ${i * 0.1}]) scale([1, 1, pixel_height]) color_${i}();`).join('\n    ')}
}

display();
`;
    
    return scadContent;
}

function sanitizeFilename(filename: string): string {
    return filename
        .replace('.png', '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
}
