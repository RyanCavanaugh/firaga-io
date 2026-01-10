import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

/**
 * Generates an OpenSCAD masks format export - a ZIP file containing:
 * - One monochrome (black/white) PNG image per color indicating filled pixels
 * - An OpenSCAD (.scad) file that loads all images and creates a 3D display
 */
export function generateOpenSCADMasks(image: PartListImage, filename: string): void {
    const basename = filename.replace(/\.[^.]+$/, '');
    
    // Generate mask images for each color
    const maskImages: Array<{ name: string; data: Blob; color: string }> = [];
    
    image.partList.forEach((entry, colorIdx) => {
        const maskCanvas = createMaskImage(image, colorIdx);
        maskCanvas.toBlob((blob) => {
            if (blob) {
                const colorName = sanitizeFilename(entry.target.name);
                maskImages.push({
                    name: `mask_${colorIdx}_${colorName}.png`,
                    data: blob,
                    color: colorEntryToHex(entry.target)
                });
                
                // Once all masks are generated, create the package
                if (maskImages.length === image.partList.length) {
                    createOpenSCADPackage(maskImages, image, basename);
                }
            }
        }, 'image/png');
    });
}

function createMaskImage(image: PartListImage, colorIdx: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black pixels where this color appears
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColorPixel = image.pixels[y][x] === colorIdx;
            
            // Black for filled, white for empty
            const value = isColorPixel ? 0 : 255;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function createOpenSCADPackage(
    maskImages: Array<{ name: string; data: Blob; color: string }>,
    image: PartListImage,
    basename: string
): void {
    // Generate the OpenSCAD script
    const scadScript = generateOpenSCADScript(maskImages, image);
    
    // For now, download files separately
    // In production, would use JSZip to create a proper ZIP archive
    
    // Download the .scad file
    const scadBlob = new Blob([scadScript], { type: 'text/plain' });
    downloadFile(scadBlob, `${basename}.scad`);
    
    // Download each mask image
    maskImages.forEach((mask) => {
        downloadFile(mask.data, mask.name);
    });
    
    alert(`OpenSCAD export complete! Downloaded ${maskImages.length + 1} files:\n` +
          `- ${basename}.scad (main OpenSCAD file)\n` +
          `- ${maskImages.length} mask images\n\n` +
          `Place all files in the same directory and open the .scad file in OpenSCAD.`);
}

function generateOpenSCADScript(
    maskImages: Array<{ name: string; data: Blob; color: string }>,
    image: PartListImage
): string {
    const voxelSize = 2.5; // mm per pixel
    const layerHeight = 2.5; // mm per layer
    
    let script = `// Generated OpenSCAD file for pixel art 3D display
// Image dimensions: ${image.width} x ${image.height} pixels
// Physical size: ${image.width * voxelSize}mm x ${image.height * voxelSize}mm

voxel_size = ${voxelSize};
layer_height = ${layerHeight};
image_width = ${image.width};
image_height = ${image.height};

// Module to create a layer from a heightmap image
module color_layer(image_file, color, z_offset) {
    color(color)
    translate([0, 0, z_offset])
    surface(file = image_file, center = true, invert = true, convexity = 10);
}

// Create voxel grid from mask
module mask_to_voxels(image_file, color_rgb) {
    color(color_rgb)
    for (y = [0 : image_height - 1]) {
        for (x = [0 : image_width - 1]) {
            // This is a simplified representation
            // In practice, you'd use surface() or a custom heightmap function
            translate([x * voxel_size, y * voxel_size, 0])
            cube([voxel_size, voxel_size, layer_height]);
        }
    }
}

// Alternative: Using surface() with heightmap
module layer_from_surface(image_file, color_rgb, z_pos) {
    color(color_rgb)
    translate([0, 0, z_pos])
    linear_extrude(height = layer_height)
    scale([voxel_size, voxel_size])
    surface(file = image_file, center = false, invert = true);
}

// Render all color layers
union() {
`;

    maskImages.forEach((mask, idx) => {
        const colorHex = mask.color;
        // Convert hex to normalized RGB for OpenSCAD
        const r = parseInt(colorHex.substring(1, 3), 16) / 255;
        const g = parseInt(colorHex.substring(3, 5), 16) / 255;
        const b = parseInt(colorHex.substring(5, 7), 16) / 255;
        
        script += `    // Layer ${idx + 1}: ${image.partList[idx].target.name}\n`;
        script += `    layer_from_surface("${mask.name}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}], ${idx * 0.1});\n\n`;
    });

    script += `}

// Note: Place all PNG mask files in the same directory as this .scad file
// The surface() function reads grayscale values to create heights
// Black pixels (value 0) create raised areas, white pixels (255) create nothing
`;

    return script;
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
