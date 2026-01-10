import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export type ThreeDSettings = {
    layerHeight: number;
    baseThickness: number;
    filename: string;
};

export async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const { layerHeight, baseThickness, filename } = settings;
    const zip = new JSZip();
    
    // Create a monochrome PNG for each color
    const maskFiles: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const maskFilename = `mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        maskFiles.push(maskFilename);
        
        // Create canvas for this color's mask
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
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
        
        // Convert canvas to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        zip.file(maskFilename, blob);
    }
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image, maskFiles, layerHeight, baseThickness);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

function generateOpenSCADFile(
    image: PartListImage, 
    maskFiles: string[], 
    layerHeight: number, 
    baseThickness: number
): string {
    const parts: string[] = [];
    
    parts.push('// Generated OpenSCAD file for multi-color heightmap');
    parts.push(`// Image size: ${image.width}x${image.height}`);
    parts.push('');
    parts.push('// Parameters');
    parts.push(`layer_height = ${layerHeight};`);
    parts.push(`base_thickness = ${baseThickness};`);
    parts.push(`img_width = ${image.width};`);
    parts.push(`img_height = ${image.height};`);
    parts.push('');
    parts.push('// Scale factor (1 pixel = 1mm)');
    parts.push('scale_factor = 1;');
    parts.push('');
    parts.push('union() {');
    
    // Add base layer
    parts.push('  // Base layer');
    parts.push('  translate([0, 0, 0])');
    parts.push(`    cube([img_width * scale_factor, img_height * scale_factor, base_thickness]);`);
    parts.push('');
    
    // Add a layer for each color
    image.partList.forEach((part, index) => {
        const maskFile = maskFiles[index];
        const zOffset = baseThickness + (index * layerHeight);
        
        parts.push(`  // Layer ${index}: ${part.target.name}`);
        parts.push('  color([' + 
            `${part.target.r / 255}, ` +
            `${part.target.g / 255}, ` +
            `${part.target.b / 255}])`);
        parts.push('  translate([0, 0, ' + zOffset + '])');
        parts.push('  scale([scale_factor, scale_factor, layer_height])');
        parts.push('  surface(file = "' + maskFile + '", invert = true, center = false);');
        parts.push('');
    });
    
    parts.push('}');
    
    return parts.join('\n');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
