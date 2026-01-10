import { PartListImage } from "./image-utils";

declare const JSZip: any;

export interface OpenSCADSettings {
    heightPerLayer: number;
    baseHeight: number;
    pixelSize: number;
}

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate one black/white image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Fill black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const colorName = sanitizeFilename(color.target.name);
        zip.file(`layer_${colorIdx}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    // Generate the zip and download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, 'openscad_model.zip', 'application/zip');
}

function generateOpenSCADFile(image: PartListImage, settings: OpenSCADSettings): string {
    const { pixelSize, heightPerLayer, baseHeight } = settings;
    
    let scad = '// Generated OpenSCAD file for layered pixel art\n';
    scad += '// Image dimensions: ' + image.width + 'x' + image.height + '\n\n';
    
    scad += `pixel_size = ${pixelSize};\n`;
    scad += `height_per_layer = ${heightPerLayer};\n`;
    scad += `base_height = ${baseHeight};\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;
    
    scad += '// Module to create a layer from a heightmap image\n';
    scad += 'module layer_from_image(filename, layer_index, color_name) {\n';
    scad += '  echo(str("Rendering layer ", layer_index, ": ", color_name));\n';
    scad += '  translate([0, 0, base_height + layer_index * height_per_layer]) {\n';
    scad += '    scale([pixel_size, pixel_size, height_per_layer]) {\n';
    scad += '      surface(file=filename, center=true, invert=true);\n';
    scad += '    }\n';
    scad += '  }\n';
    scad += '}\n\n';
    
    scad += '// Combine all layers\n';
    scad += 'union() {\n';
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const colorName = sanitizeFilename(color.target.name);
        const filename = `layer_${colorIdx}_${colorName}.png`;
        scad += `  layer_from_image("${filename}", ${colorIdx}, "${escapeString(color.target.name)}");\n`;
    }
    
    scad += '}\n';
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function downloadFile(blob: Blob, filename: string, mimeType: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve();
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
