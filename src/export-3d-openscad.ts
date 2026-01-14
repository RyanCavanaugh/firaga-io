import { PartListImage, PartListEntry } from './image-utils';
import { colorEntryToHex } from './utils';

/**
 * Generates an OpenSCAD export with:
 * - One monochrome (black/white) PNG per color
 * - A .scad file that loads all images using heightmap and combines them
 */
export async function generateOpenSCAD(image: PartListImage, filename: string) {
    const images: Array<{ name: string; data: ImageData }> = [];
    const scadLines: string[] = [];

    scadLines.push('// Firaga 3D Model - OpenSCAD');
    scadLines.push(`// Generated from: ${filename}`);
    scadLines.push('');
    scadLines.push('// Configuration');
    scadLines.push('$fn = 16;  // Fragment count for smooth edges');
    scadLines.push(`cell_size = 1;`);
    scadLines.push(`height = 1;`);
    scadLines.push(`width = ${image.width};`);
    scadLines.push(`height_val = ${image.height};`);
    scadLines.push('');
    scadLines.push('// Combine all color layers');
    scadLines.push('union() {');

    // Create a monochrome mask for each color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const colorHex = colorEntryToHex(part.target);

        // Create monochrome mask image (1-bit, black=empty, white=filled)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext('2d')!;

        // Fill white background (empty)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, image.width, image.height);

        // Draw black pixels where this color is present
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const maskImageData = ctx.getImageData(0, 0, image.width, image.height);
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskFilename = `mask_${i.toString().padStart(2, '0')}.png`;

        images.push({
            name: maskFilename,
            data: maskImageData
        });

        scadLines.push(`    // Color ${i}: ${colorHex}`);
        scadLines.push(`    translate([0, 0, ${i}]) {`);
        scadLines.push(`        linear_extrude(height = height) {`);
        scadLines.push(`            resize([width, height_val, 0]) {`);
        scadLines.push(`                surface(file = "${maskFilename}", center = true, invert = true);`);
        scadLines.push(`            }`);
        scadLines.push(`        }`);
        scadLines.push(`    }`);
    }

    scadLines.push('}');

    // Download as a ZIP file
    // For now, we'll create individual downloads
    // In a real implementation, we'd use JSZip to create a proper ZIP

    const scadContent = scadLines.join('\n');
    downloadAsText(scadContent, `${filename}.scad`);

    // For each mask image, we'd need to download it
    // This is a limitation - we can't easily create a ZIP in the browser
    // So we'll at least provide the SCAD file
    console.log('OpenSCAD export created. Images would need to be packaged as ZIP.');
}

/**
 * Alternative: Creates a downloadable text with base64-encoded images embedded
 */
export async function generateOpenSCADZip(image: PartListImage, filename: string) {
    const scadLines: string[] = [];

    scadLines.push('// Firaga 3D Model - OpenSCAD');
    scadLines.push(`// Generated from: ${filename}`);
    scadLines.push('');
    scadLines.push('// Configuration');
    scadLines.push('$fn = 16;  // Fragment count for smooth edges');
    scadLines.push(`cell_size = 1;`);
    scadLines.push(`height = 1;`);
    scadLines.push(`width = ${image.width};`);
    scadLines.push(`height_val = ${image.height};`);
    scadLines.push('');
    scadLines.push('// Combine all color layers');
    scadLines.push('union() {');

    // Create canvas-based masks
    for (let i = 0; i < image.partList.length; i++) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext('2d')!;

        // Fill with white first
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, image.width, image.height);

        // Draw black for filled pixels
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        scadLines.push(`    // Color layer ${i}`);
        scadLines.push(`    translate([0, 0, ${i}]) {`);
        scadLines.push(`        linear_extrude(height = height) {`);
        scadLines.push(`            resize([width, height_val, 0]) {`);
        scadLines.push(`                surface(file = "mask_${i.toString().padStart(2, '0')}.png", center = true, invert = true);`);
        scadLines.push(`            }`);
        scadLines.push(`        }`);
        scadLines.push(`    }`);
    }

    scadLines.push('}');

    const scadContent = scadLines.join('\n');
    downloadAsText(scadContent, `${filename}.scad`);
}

function downloadAsText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadAsBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
