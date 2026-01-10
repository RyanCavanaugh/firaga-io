import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: typeof import("jszip");

export async function makeOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    await loadJSZipAnd(() => makeOpenSCADMasksWorker(image, filename));
}

async function loadJSZipAnd(func: () => void): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

async function makeOpenSCADMasksWorker(image: PartListImage, filename: string): Promise<void> {
    const zip = new JSZip();
    const width = image.width;
    const height = image.height;

    // Generate one mask image per color
    const imagePromises: Promise<void>[] = [];
    image.partList.forEach((part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                
                // White for this color, black for others
                const value = isThisColor ? 255 : 0;
                data[idx] = value;     // R
                data[idx + 1] = value; // G
                data[idx + 2] = value; // B
                data[idx + 3] = 255;   // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
        
        const maskFilename = `mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(maskFilename, blob);
                }
                resolve();
            });
        });
        
        imagePromises.push(promise);
    });

    await Promise.all(imagePromises);

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);

    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage): string {
    const width = image.width;
    const height = image.height;
    const pixelSize = 1.0;
    const baseHeight = 1.0;

    let modules = '';
    let union = '';

    image.partList.forEach((part, colorIndex) => {
        const maskFilename = `mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        const moduleName = `color_${colorIndex}`;
        
        modules += `
module ${moduleName}() {
    color([${part.target.r / 255}, ${part.target.g / 255}, ${part.target.b / 255}])
    surface(file = "${maskFilename}", center = true, invert = true);
}
`;
        
        union += `    ${moduleName}();\n`;
    });

    return `// Generated OpenSCAD file for ${image.partList.length} colors
// Image dimensions: ${width} x ${height}

pixel_size = ${pixelSize};
base_height = ${baseHeight};

scale([pixel_size, pixel_size, base_height]) {
    union() {
${union}    }
}
${modules}`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
