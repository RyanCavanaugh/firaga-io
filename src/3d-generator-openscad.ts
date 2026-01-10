import { PartListImage } from "./image-utils";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Generates a ZIP file containing:
 * - One monochrome (black/white) PNG image per color
 * - An OpenSCAD file that uses heightmap functionality to combine them
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    const zip = new JSZip();

    // Generate one mask image per color
    const maskPromises = image.partList.map(async (color, colorIdx) => {
        const maskData = createMaskForColor(image, colorIdx);
        const blob = await canvasToBlob(maskData);
        zip.file(`mask_${colorIdx}_${sanitizeFilename(color.target.name)}.png`, blob);
    });

    await Promise.all(maskPromises);

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

function createMaskForColor(image: PartListImage, colorIdx: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(image.width, image.height);
    
    // Create black/white mask: white where this color appears, black elsewhere
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelColorIdx = image.pixels[y][x];
            
            if (pixelColorIdx === colorIdx) {
                // White for this color
                imageData.data[idx] = 255;     // R
                imageData.data[idx + 1] = 255; // G
                imageData.data[idx + 2] = 255; // B
                imageData.data[idx + 3] = 255; // A
            } else {
                // Black for other colors or transparent
                imageData.data[idx] = 0;       // R
                imageData.data[idx + 1] = 0;   // G
                imageData.data[idx + 2] = 0;   // B
                imageData.data[idx + 3] = 255; // A
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, 'image/png');
    });
}

function generateOpenSCADFile(image: PartListImage): string {
    const voxelSize = 1.0; // Size of each voxel in mm
    const layerHeight = 1.0; // Height of each color layer in mm

    let scadContent = `// OpenSCAD file for visualizing color masks
// Generated from image: ${image.width}x${image.height} pixels
// Total colors: ${image.partList.length}

// Parameters
voxel_size = ${voxelSize};
layer_height = ${layerHeight};
image_width = ${image.width};
image_height = ${image.height};

// Combine all color layers
union() {
`;

    // Add each color layer
    image.partList.forEach((color, colorIdx) => {
        const colorName = sanitizeFilename(color.target.name);
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;

        scadContent += `    // Layer ${colorIdx}: ${color.target.name} (${color.count} pixels)
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    translate([0, 0, ${colorIdx * layerHeight}])
    scale([voxel_size, voxel_size, layer_height])
    surface(file = "mask_${colorIdx}_${colorName}.png", center = false, invert = true);
    
`;
    });

    scadContent += `}

// Alternative: View layers stacked vertically with separation
// Uncomment to use this view instead
/*
union() {
`;

    image.partList.forEach((color, colorIdx) => {
        const colorName = sanitizeFilename(color.target.name);
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        const separation = 5; // mm separation between layers

        scadContent += `    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    translate([0, ${colorIdx * (image.height * voxelSize + separation)}, 0])
    scale([voxel_size, voxel_size, layer_height])
    surface(file = "mask_${colorIdx}_${colorName}.png", center = false, invert = true);
    
`;
    });

    scadContent += `}
*/
`;

    return scadContent;
}

function sanitizeFilename(name: string): string {
    // Replace spaces and special characters with underscores
    return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
}
