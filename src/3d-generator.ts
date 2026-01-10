import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

declare const JSZip: any;

/**
 * Generates a 3MF file with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Generates OpenSCAD masks - a zip file with monochrome images per color and an OpenSCAD file
 */
export async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    const masks: Array<{ colorName: string; maskData: string }> = [];

    // Generate a mask image for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const maskCanvas = createMaskCanvas(image, colorIndex);
        const dataUrl = maskCanvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const maskFilename = `mask_${sanitizeFilename(part.target.name)}.png`;
        
        zip.file(maskFilename, base64Data, { base64: true });
        masks.push({ colorName: part.target.name, maskData: maskFilename });
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(masks, image.width, image.height);
    zip.file(`${filename}.scad`, scadContent);

    // Generate and save the zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

/**
 * Creates a monochrome mask canvas for a specific color
 */
function createMaskCanvas(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(image.width, image.height);

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelColorIndex = image.pixels[y][x];
            const offset = (y * image.width + x) * 4;
            
            // White if this pixel matches the color, black otherwise
            const value = pixelColorIndex === colorIndex ? 255 : 0;
            imageData.data[offset] = value;
            imageData.data[offset + 1] = value;
            imageData.data[offset + 2] = value;
            imageData.data[offset + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Generates the OpenSCAD file content that loads and combines all masks
 */
function generateOpenSCADFile(masks: Array<{ colorName: string; maskData: string }>, width: number, height: number): string {
    let scadCode = `// Generated OpenSCAD file for pixel art 3D display
// Image dimensions: ${width}x${height}

// Scale factor for the overall model
scale_factor = 1;

// Height per layer
layer_height = 0.5;

// Combine all color layers
union() {
`;

    masks.forEach((mask, index) => {
        scadCode += `    // Layer ${index + 1}: ${mask.colorName}\n`;
        scadCode += `    color([${Math.random()}, ${Math.random()}, ${Math.random()}])\n`;
        scadCode += `    translate([0, 0, ${index * 0.5}])\n`;
        scadCode += `    scale([scale_factor, scale_factor, layer_height])\n`;
        scadCode += `    surface(file = "${mask.maskData}", center = true, invert = false);\n\n`;
    });

    scadCode += `}\n`;
    return scadCode;
}

/**
 * Builds the 3MF XML content with triangle meshes for each color
 */
function build3MFContent(image: PartListImage): string {
    const models: string[] = [];
    let objectId = 1;

    // Create a mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Build geometry for this color's pixels
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseIndex = vertices.length;
                    const z = colorIndex * 0.5; // Stack colors at different heights

                    // Add 8 vertices for a cube
                    vertices.push([x, y, z]);
                    vertices.push([x + 1, y, z]);
                    vertices.push([x + 1, y + 1, z]);
                    vertices.push([x, y + 1, z]);
                    vertices.push([x, y, z + 0.5]);
                    vertices.push([x + 1, y, z + 0.5]);
                    vertices.push([x + 1, y + 1, z + 0.5]);
                    vertices.push([x, y + 1, z + 0.5]);

                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([baseIndex, baseIndex + 2, baseIndex + 1]);
                    triangles.push([baseIndex, baseIndex + 3, baseIndex + 2]);
                    // Top
                    triangles.push([baseIndex + 4, baseIndex + 5, baseIndex + 6]);
                    triangles.push([baseIndex + 4, baseIndex + 6, baseIndex + 7]);
                    // Front
                    triangles.push([baseIndex, baseIndex + 1, baseIndex + 5]);
                    triangles.push([baseIndex, baseIndex + 5, baseIndex + 4]);
                    // Back
                    triangles.push([baseIndex + 3, baseIndex + 7, baseIndex + 6]);
                    triangles.push([baseIndex + 3, baseIndex + 6, baseIndex + 2]);
                    // Left
                    triangles.push([baseIndex, baseIndex + 4, baseIndex + 7]);
                    triangles.push([baseIndex, baseIndex + 7, baseIndex + 3]);
                    // Right
                    triangles.push([baseIndex + 1, baseIndex + 2, baseIndex + 6]);
                    triangles.push([baseIndex + 1, baseIndex + 6, baseIndex + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            const verticesXml = vertices.map(v => `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`).join('\n            ');
            const trianglesXml = triangles.map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`).join('\n            ');

            models.push(`    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
            ${verticesXml}
            </vertices>
            <triangles>
            ${trianglesXml}
            </triangles>
        </mesh>
    </object>`);
            objectId++;
        }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${models.join('\n')}
  </resources>
  <build>
${models.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;
}

/**
 * Sanitizes a filename to remove invalid characters
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Loads JSZip library dynamically
 */
async function loadJSZip(): Promise<void> {
    if (typeof JSZip !== 'undefined') {
        return;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}
