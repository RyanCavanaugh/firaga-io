import JSZip from "jszip";
import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { ThreeDSettings } from "./3d-types";

export async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    const { width, height, partList } = image;
    const { pixelSize, height: extrusionHeight } = settings;

    const zip = new JSZip();

    // Generate one monochrome image per color
    const imageFiles: string[] = [];
    
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const entry = partList[colorIndex];
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) continue;

        // Create monochrome image: white where this color appears, black elsewhere
        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const pixelColorIndex = image.pixels[y][x];
                
                if (pixelColorIndex === colorIndex) {
                    // White pixel
                    imageData.data[offset] = 255;
                    imageData.data[offset + 1] = 255;
                    imageData.data[offset + 2] = 255;
                    imageData.data[offset + 3] = 255;
                } else {
                    // Black pixel
                    imageData.data[offset] = 0;
                    imageData.data[offset + 1] = 0;
                    imageData.data[offset + 2] = 0;
                    imageData.data[offset + 3] = 255;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert to PNG blob
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        const filename = `color_${colorIndex}_${sanitizeFilename(entry.target.name)}.png`;
        imageFiles.push(filename);
        zip.file(filename, base64Data, { base64: true });
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(imageFiles, partList, pixelSize, extrusionHeight, width, height);
    zip.file("display.scad", scadContent);

    // Generate the ZIP file
    return await zip.generateAsync({ type: "blob" });
}

function generateOpenSCADFile(
    imageFiles: string[],
    partList: PartListImage["partList"],
    pixelSize: number,
    extrusionHeight: number,
    imageWidth: number,
    imageHeight: number
): string {
    const layers: string[] = [];

    imageFiles.forEach((filename, index) => {
        const entry = partList[index];
        const colorHex = colorEntryToHex(entry.target);
        const rgb = hexToRgb(colorHex);

        layers.push(`
// ${entry.target.name}
color([${rgb.r / 255}, ${rgb.g / 255}, ${rgb.b / 255}])
translate([0, 0, ${index * 0.01}]) // Slight offset to prevent z-fighting
linear_extrude(height = ${extrusionHeight})
scale([${pixelSize}, ${pixelSize}, 1])
surface(file = "${filename}", center = true, invert = true);`);
    });

    return `// Generated OpenSCAD file for 3D display
// Image size: ${imageWidth}x${imageHeight} pixels
// Pixel size: ${pixelSize}mm
// Extrusion height: ${extrusionHeight}mm

${layers.join('\n')}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

export function downloadOpenSCADMasks(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".zip") ? filename : `${filename}_openscad.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
