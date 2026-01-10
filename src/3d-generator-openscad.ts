import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

/**
 * Generates an OpenSCAD masks format as a zip file containing:
 * - One monochrome (black/white) PNG image per color
 * - An OpenSCAD file that loads all images using heightmap functionality
 */
export async function generateOpenSCADMasks(
    image: PartListImage,
    settings: OpenSCADSettings
): Promise<Blob> {
    await loadJSZip();

    const zip = new JSZip();
    const imageFiles: string[] = [];

    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const maskCanvas = createMaskImage(image, colorIdx);
        
        const filename = `mask_${sanitizeFilename(part.target.name)}_${colorIdx}.png`;
        imageFiles.push(filename);
        
        // Convert canvas to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            maskCanvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        zip.file(filename, blob);
    }

    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles, settings);
    zip.file("heightmap.scad", scadContent);

    // Generate the zip file
    return await zip.generateAsync({ type: 'blob' });
}

export type OpenSCADSettings = {
    readonly voxelSize: number;
    readonly height: number;
};

function createMaskImage(image: PartListImage, colorIdx: number): HTMLCanvasElement {
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

    return canvas;
}

function generateOpenSCADFile(
    image: PartListImage,
    imageFiles: string[],
    settings: OpenSCADSettings
): string {
    const { voxelSize, height } = settings;
    
    const modules: string[] = [];
    const calls: string[] = [];

    image.partList.forEach((part, idx) => {
        const filename = imageFiles[idx];
        const colorHex = colorEntryToHex(part.target);
        
        // Convert hex color to RGB values (0-1 range)
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;

        modules.push(`
// ${part.target.name}
module layer_${idx}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    scale([${voxelSize}, ${voxelSize}, ${height}])
    surface(file = "${filename}", center = true, invert = true);
}`);

        calls.push(`layer_${idx}();`);
    });

    return `// Generated OpenSCAD heightmap file
// Image dimensions: ${image.width}x${image.height}
// Voxel size: ${voxelSize}mm
// Height: ${height}mm

${modules.join('\n')}

// Render all layers
union() {
${calls.map(c => '    ' + c).join('\n')}
}
`;
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        await new Promise<void>((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error("Failed to load JSZip"));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
