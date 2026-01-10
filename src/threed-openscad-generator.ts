import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';

export function generateOpenSCADMasks(image: PartListImage, filename: string) {
    // Generate OpenSCAD file and mask images
    const masks = generateMasks(image);
    const scadFile = generateOpenSCADFile(image, masks);
    
    // Since we don't have JSZip, we'll need to generate files separately
    // or include it as a dependency
    // For now, let's create a simple solution that downloads multiple files
    
    // Download the OpenSCAD file
    const scadBlob = new Blob([scadFile], { type: 'text/plain' });
    saveAs(scadBlob, `${filename}.scad`);
    
    // Download each mask
    masks.forEach((maskData, idx) => {
        const maskBlob = dataURLToBlob(maskData.dataURL);
        saveAs(maskBlob, `${filename}_mask_${idx}_${maskData.name}.png`);
    });
    
    // Inform user about multiple downloads
    alert(`Downloading ${masks.length + 1} files:\n- 1 OpenSCAD file (.scad)\n- ${masks.length} mask images (.png)\n\nPlace all files in the same directory.`);
}

function generateMasks(image: PartListImage): Array<{ name: string, dataURL: string }> {
    const masks: Array<{ name: string, dataURL: string }> = [];
    
    // Create one mask per color
    image.partList.forEach((part, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        masks.push({
            name: sanitizeFilename(part.target.name),
            dataURL: canvas.toDataURL('image/png')
        });
    });
    
    return masks;
}

function generateOpenSCADFile(image: PartListImage, masks: Array<{ name: string, dataURL: string }>): string {
    let scad = '// OpenSCAD file generated from image\n';
    scad += '// Each color is represented as a heightmap from a mask image\n\n';
    
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n`;
    scad += `pixel_size = 1;\n`;
    scad += `layer_height = 0.1;\n\n`;
    
    scad += '// Combine all color layers\n';
    scad += 'union() {\n';
    
    image.partList.forEach((part, idx) => {
        const maskName = sanitizeFilename(part.target.name);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scad += `  // Layer ${idx + 1}: ${part.target.name}\n`;
        scad += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scad += `  translate([0, 0, ${idx * 0.1}])\n`;
        scad += `  scale([pixel_size, pixel_size, layer_height])\n`;
        scad += `  surface(file = "${maskName}.png", center = false, invert = true);\n\n`;
    });
    
    scad += '}\n';
    
    return scad;
}

function sanitizeFilename(name: string): string {
    // Remove or replace characters that are problematic in filenames
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
}
