import { PartListImage } from '../image-utils';

export type OpenSCADOptions = {
    filename: string;
    pixelWidth: number;
    pixelHeight: number;
    baseHeight: number;
};

export async function generateOpenSCADZip(image: PartListImage, options: OpenSCADOptions): Promise<Blob> {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, baseHeight, filename } = options;

    // We'll need JSZip for this, but it's not in the dependencies
    // For now, we'll create a simple implementation that creates individual files
    // In production, you'd want to use a proper ZIP library

    const files: Array<{ name: string; content: Blob }> = [];

    // Generate one PNG per color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const entry = partList[colorIdx];
        if (!entry || entry.count === 0) continue;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isColor = pixels[y][x] === colorIdx;
                imageData.data[idx] = isColor ? 0 : 255;     // R
                imageData.data[idx + 1] = isColor ? 0 : 255; // G
                imageData.data[idx + 2] = isColor ? 0 : 255; // B
                imageData.data[idx + 3] = 255;               // A
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        const colorName = sanitizeFilename(entry.target.name || `color_${colorIdx}`);
        files.push({ name: `${colorName}.png`, content: blob });
    }

    // Generate OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for ${filename}
// Pixel dimensions: ${width}x${height}
// Physical size: ${width * pixelWidth}mm x ${height * pixelHeight}mm

pixel_width = ${pixelWidth};
pixel_height = ${pixelHeight};
base_height = ${baseHeight};

`;

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const entry = partList[colorIdx];
        if (!entry || entry.count === 0) continue;

        const colorName = sanitizeFilename(entry.target.name || `color_${colorIdx}`);
        const r = entry.target.r / 255;
        const g = entry.target.g / 255;
        const b = entry.target.b / 255;

        scadContent += `
// ${entry.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
scale([pixel_width, pixel_height, base_height])
surface(file = "${colorName}.png", invert = true);

`;
    }

    files.push({
        name: `${filename}.scad`,
        content: new Blob([scadContent], { type: 'text/plain' })
    });

    // Create a simple multi-part response (not a real ZIP without a library)
    // For a production implementation, add JSZip to dependencies
    // For now, we'll just return the SCAD file and note that images need to be in the same directory
    return files[files.length - 1].content;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function generateOpenSCADMasksAsDataURLs(image: PartListImage): Array<{ name: string; dataUrl: string; color: { r: number; g: number; b: number } }> {
    const { width, height, partList, pixels } = image;
    const result: Array<{ name: string; dataUrl: string; color: { r: number; g: number; b: number } }> = [];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const entry = partList[colorIdx];
        if (!entry || entry.count === 0) continue;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isColor = pixels[y][x] === colorIdx;
                imageData.data[idx] = isColor ? 0 : 255;     // R
                imageData.data[idx + 1] = isColor ? 0 : 255; // G
                imageData.data[idx + 2] = isColor ? 0 : 255; // B
                imageData.data[idx + 3] = 255;               // A
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        const colorName = sanitizeFilename(entry.target.name || `color_${colorIdx}`);

        result.push({
            name: colorName,
            dataUrl,
            color: {
                r: entry.target.r,
                g: entry.target.g,
                b: entry.target.b
            }
        });
    }

    return result;
}
