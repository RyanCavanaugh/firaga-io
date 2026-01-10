import { PartListImage } from "./image-utils";
import { Export3DSettings } from "./export-3mf";

declare const JSZip: any;

export async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings): Promise<void> {
    await loadJSZip();
    const zip = new JSZip();

    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;

    // Generate one image per color
    partList.forEach((part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Fill with white (background)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to PNG and add to zip
        canvas.toBlob((blob) => {
            if (blob) {
                const colorName = sanitizeFilename(part.target.name);
                zip.file(`${colorIndex}_${colorName}.png`, blob);
            }
        }, 'image/png');
    });

    // Wait for all blobs to be created
    await new Promise(resolve => setTimeout(resolve, 100 * partList.length));

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('display.scad', scadContent);

    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(blob, 'openscad-masks.zip');
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { partList } = image;
    const { pixelHeight, baseHeight } = settings;

    let scadCode = `// Generated OpenSCAD file for 3D pixel art display
// Image dimensions: ${image.width}x${image.height}

`;

    // Add modules for each color layer
    partList.forEach((part, colorIndex) => {
        const colorName = sanitizeFilename(part.target.name);
        const r = (part.target.r / 255).toFixed(3);
        const g = (part.target.g / 255).toFixed(3);
        const b = (part.target.b / 255).toFixed(3);

        scadCode += `module layer_${colorIndex}_${colorName}() {
  color([${r}, ${g}, ${b}])
  translate([0, 0, ${baseHeight}])
  surface(file = "${colorIndex}_${colorName}.png", center = true, invert = true);
  linear_extrude(height = ${pixelHeight})
    scale([1/${image.width}, 1/${image.height}, 1])
    translate([-${image.width/2}, -${image.height/2}, 0])
    surface(file = "${colorIndex}_${colorName}.png", invert = true);
}

`;
    });

    // Add main assembly
    scadCode += `// Main assembly
union() {
`;

    partList.forEach((part, colorIndex) => {
        const colorName = sanitizeFilename(part.target.name);
        scadCode += `  layer_${colorIndex}_${colorName}();\n`;
    });

    scadCode += `}
`;

    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
