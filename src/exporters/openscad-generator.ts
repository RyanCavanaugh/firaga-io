import { PartListImage } from '../image-utils';

/**
 * Generates an OpenSCAD masks export as a zip file
 * Contains one monochrome image per color and an OpenSCAD file
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    // We'll use JSZip for creating the zip file
    // First check if it's available, if not we'll use a simpler approach
    
    const files: Array<{ name: string, data: Blob | string }> = [];
    
    // Generate one black/white image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        if (part.count === 0) continue;
        
        // Create a canvas for this color mask
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
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob
        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                    files.push({
                        name: `mask_${colorIdx}_${safeName}.png`,
                        data: blob
                    });
                }
                resolve();
            }, 'image/png');
        });
    }
    
    // Generate the OpenSCAD file
    const scadContent = generateSCADFile(image, filename);
    files.push({
        name: `${filename}.scad`,
        data: scadContent
    });
    
    // Create a simple zip file using a basic implementation
    // Since JSZip might not be available, we'll try to use it if present
    // Otherwise fall back to downloading files individually
    
    if (typeof (window as any).JSZip !== 'undefined') {
        // Use JSZip if available
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        for (const file of files) {
            zip.file(file.name, file.data);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, `${filename}_openscad.zip`);
    } else {
        // Fallback: create a manual zip or download separately
        await createSimpleZip(files, `${filename}_openscad.zip`);
    }
}

/**
 * Generates the OpenSCAD (.scad) file content
 */
function generateSCADFile(image: PartListImage, filename: string): string {
    const parts: string[] = [];
    
    parts.push(`// Generated OpenSCAD file for ${filename}`);
    parts.push(`// Image size: ${image.width} x ${image.height}`);
    parts.push('');
    parts.push('// Height scale for the heightmap');
    parts.push('height_scale = 1;');
    parts.push('');
    
    // Add a module for each color layer
    image.partList.forEach((part, colorIdx) => {
        if (part.count === 0) return;
        
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `mask_${colorIdx}_${safeName}.png`;
        
        parts.push(`// Layer for ${part.target.name}`);
        parts.push(`module layer_${colorIdx}() {`);
        parts.push(`    color([${part.target.r / 255}, ${part.target.g / 255}, ${part.target.b / 255}])`);
        parts.push(`    surface(file = "${filename}", center = true, invert = true);`);
        parts.push(`}`);
        parts.push('');
    });
    
    // Combine all layers
    parts.push('// Combine all layers');
    parts.push('union() {');
    image.partList.forEach((part, colorIdx) => {
        if (part.count === 0) return;
        parts.push(`    translate([0, 0, ${colorIdx * 0.1}]) layer_${colorIdx}();`);
    });
    parts.push('}');
    
    return parts.join('\n');
}

/**
 * Creates a simple zip file using basic methods
 */
async function createSimpleZip(files: Array<{ name: string, data: Blob | string }>, zipName: string) {
    // For now, we'll use a simple approach: try to load JSZip dynamically
    // If that fails, we could download files individually or show an error
    
    try {
        // Try to dynamically import/load JSZip
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        
        await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
        
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        for (const file of files) {
            zip.file(file.name, file.data);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, zipName);
    } catch (e) {
        // Fallback: download files individually
        console.error('Could not create zip file, downloading files individually', e);
        for (const file of files) {
            const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'text/plain' });
            downloadBlob(blob, file.name);
        }
    }
}

/**
 * Downloads a blob as a file
 */
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
