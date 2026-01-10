import { PartListImage } from "./image-utils";
import { ThreeDSettings } from "./3mf-generator";

export async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    // Generate one PNG per color showing which pixels are filled
    const pngFiles = generateColorMasks(image);
    
    // Generate the OpenSCAD file
    const scadContent = generateScadFile(image, settings.layerHeight);
    
    // Create zip file
    const blob = await createOpenSCADZip(pngFiles, scadContent);
    
    // Download
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function generateColorMasks(image: PartListImage): Map<string, Blob> {
    const masks = new Map<string, Blob>();
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to data URL then to blob synchronously
        const dataUrl = canvas.toDataURL('image/png');
        const blob = dataURLtoBlob(dataUrl);
        const filename = `mask_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        masks.set(filename, blob);
    }
    
    return masks;
}

function dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function generateScadFile(image: PartListImage, layerHeight: number): string {
    const pixelSize = 1.0; // 1mm per pixel
    const layers: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const filename = `mask_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        const colorRgb = [color.target.r / 255, color.target.g / 255, color.target.b / 255];
        
        layers.push(`
// ${color.target.name} (${color.count} pixels)
color([${colorRgb[0].toFixed(3)}, ${colorRgb[1].toFixed(3)}, ${colorRgb[2].toFixed(3)}])
translate([0, 0, ${colorIndex * layerHeight}])
scale([${pixelSize}, ${pixelSize}, ${layerHeight}])
surface(file = "${filename}", center = false, invert = true);
`);
    }
    
    return `// Generated OpenSCAD file for pixel art
// Image dimensions: ${image.width} x ${image.height}
// Layer height: ${layerHeight}mm
// Pixel size: ${pixelSize}mm

$fn = 20; // Resolution for curved surfaces

// Each color layer is generated from a heightmap image
// Black pixels in the mask = full height
// White pixels in the mask = zero height

${layers.join('\n')}

// Total height: ${image.partList.length * layerHeight}mm
// Total width: ${image.width * pixelSize}mm
// Total depth: ${image.height * pixelSize}mm
`;
}

async function createOpenSCADZip(pngFiles: Map<string, Blob>, scadContent: string): Promise<Blob> {
    if (typeof (window as any).JSZip !== 'undefined') {
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        // Add PNG files
        for (const [filename, blob] of pngFiles.entries()) {
            zip.file(filename, blob);
        }
        
        // Add SCAD file
        zip.file('model.scad', scadContent);
        
        // Add README
        zip.file('README.txt', `OpenSCAD Pixel Art Model

This archive contains:
1. model.scad - The main OpenSCAD file
2. mask_*.png - Heightmap images for each color layer

To use:
1. Extract all files to the same directory
2. Open model.scad in OpenSCAD
3. Press F5 to preview or F6 to render

The model is built by stacking layers, one per color, using heightmap images.
`);
        
        return await zip.generateAsync({ type: 'blob' });
    } else {
        // Fallback: just return the SCAD content
        return new Blob([scadContent], { type: 'text/plain' });
    }
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
