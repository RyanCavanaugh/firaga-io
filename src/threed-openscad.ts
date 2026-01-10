import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Generates a ZIP file with OpenSCAD masks:
 * - One monochrome (black/white) PNG image per color
 * - An OpenSCAD file that loads all images and combines them
 */
export function generateOpenSCADMasks(image: PartListImage, filename: string) {
    const zip = new JSZip();

    // Generate a black/white image for each color
    const imagePromises: Promise<void>[] = [];
    const colorFiles: Array<{ filename: string, colorName: string, r: number, g: number, b: number }> = [];

    image.partList.forEach((part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Create ImageData for this color mask
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Fill with white background
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;     // R
            imageData.data[i + 1] = 255; // G
            imageData.data[i + 2] = 255; // B
            imageData.data[i + 3] = 255; // A
        }
        
        // Set black pixels for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const index = (y * image.width + x) * 4;
                    imageData.data[index] = 0;     // R
                    imageData.data[index + 1] = 0; // G
                    imageData.data[index + 2] = 0; // B
                    imageData.data[index + 3] = 255; // A
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob and add to zip
        const colorFilename = `mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`;
        colorFiles.push({
            filename: colorFilename,
            colorName: part.target.name,
            r: part.target.r,
            g: part.target.g,
            b: part.target.b
        });
        
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(colorFilename, blob);
                }
                resolve();
            }, 'image/png');
        });
        
        imagePromises.push(promise);
    });

    // Wait for all images to be generated
    Promise.all(imagePromises).then(() => {
        // Generate OpenSCAD file
        const scadContent = generateOpenSCADFile(colorFiles, image.width, image.height);
        zip.file(`${filename}.scad`, scadContent);
        
        // Generate the ZIP file
        zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
            saveAs(blob, `${filename}_openscad.zip`);
        });
    });
}

function sanitizeFilename(name: string): string {
    // Remove or replace characters that are problematic in filenames
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function generateOpenSCADFile(
    colorFiles: Array<{ filename: string, colorName: string, r: number, g: number, b: number }>,
    width: number,
    height: number
): string {
    const pixelSize = 1.0; // Size of each pixel in mm
    const layerHeight = 0.5; // Height of each color layer
    
    let scadCode = `// Generated OpenSCAD file for pixel art
// Image dimensions: ${width}x${height}
// Each pixel is ${pixelSize}mm x ${pixelSize}mm

// Parameters
pixel_size = ${pixelSize};
layer_height = ${layerHeight};
image_width = ${width};
image_height = ${height};

// Function to convert heightmap to 3D shape
module heightmap_layer(image_file, color, z_offset) {
    color(color)
    translate([0, 0, z_offset])
    scale([pixel_size, pixel_size, layer_height])
    surface(file=image_file, center=true, invert=true);
}

// Main assembly
`;

    // Add each color layer
    colorFiles.forEach((colorFile, index) => {
        const r = (colorFile.r / 255).toFixed(3);
        const g = (colorFile.g / 255).toFixed(3);
        const b = (colorFile.b / 255).toFixed(3);
        const zOffset = index * layerHeight;
        
        scadCode += `
// ${colorFile.colorName}
heightmap_layer("${colorFile.filename}", [${r}, ${g}, ${b}], ${zOffset.toFixed(2)});
`;
    });

    return scadCode;
}
