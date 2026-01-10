import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDExportSettings {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    baseThickness: number; // Thickness of base in mm
}

/**
 * Generate and download a 3D file from the image
 */
export async function make3DFile(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const pixelSize = settings.pixelHeight;
    const baseThickness = settings.baseThickness;

    // Build materials section
    let materialsXml = '<basematerials id="1">\n';
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        materialsXml += `  <base name="${escapeXml(part.target.name)}" displaycolor="#${hex.toUpperCase()}" />\n`;
    });
    materialsXml += '</basematerials>';

    // Build mesh objects for each color
    let objectsXml = '';
    let buildItemsXml = '';
    let objectId = 2;

    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number, number]> = []; // [v1, v2, v3, materialId]

        // Find all pixels of this color and create cubes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseThickness + pixelSize;

                    const vStart = vertices.length;
                    // 8 vertices of the cube
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([vStart + 0, vStart + 2, vStart + 1, colorIdx]);
                    triangles.push([vStart + 0, vStart + 3, vStart + 2, colorIdx]);
                    // Top face (z=z1)
                    triangles.push([vStart + 4, vStart + 5, vStart + 6, colorIdx]);
                    triangles.push([vStart + 4, vStart + 6, vStart + 7, colorIdx]);
                    // Front face (y=y0)
                    triangles.push([vStart + 0, vStart + 1, vStart + 5, colorIdx]);
                    triangles.push([vStart + 0, vStart + 5, vStart + 4, colorIdx]);
                    // Back face (y=y1)
                    triangles.push([vStart + 2, vStart + 3, vStart + 7, colorIdx]);
                    triangles.push([vStart + 2, vStart + 7, vStart + 6, colorIdx]);
                    // Left face (x=x0)
                    triangles.push([vStart + 0, vStart + 4, vStart + 7, colorIdx]);
                    triangles.push([vStart + 0, vStart + 7, vStart + 3, colorIdx]);
                    // Right face (x=x1)
                    triangles.push([vStart + 1, vStart + 2, vStart + 6, colorIdx]);
                    triangles.push([vStart + 1, vStart + 6, vStart + 5, colorIdx]);
                }
            }
        }

        if (vertices.length > 0) {
            let meshXml = `<object id="${objectId}" type="model">\n`;
            meshXml += '  <mesh>\n    <vertices>\n';
            vertices.forEach(v => {
                meshXml += `      <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />\n`;
            });
            meshXml += '    </vertices>\n    <triangles>\n';
            triangles.forEach(t => {
                meshXml += `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${t[3]}" />\n`;
            });
            meshXml += '    </triangles>\n  </mesh>\n</object>\n';

            objectsXml += meshXml;
            buildItemsXml += `  <item objectid="${objectId}" />\n`;
            objectId++;
        }
    });

    // Assemble the complete 3MF file
    const model3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${materialsXml}
    ${objectsXml}
  </resources>
  <build>
${buildItemsXml}
  </build>
</model>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    // Create a ZIP file (3MF is a ZIP archive)
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", model3mf);
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rels);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

/**
 * Generate a ZIP file with OpenSCAD masks
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one PNG per color
    const imagePromises: Array<Promise<void>> = [];
    partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (pixels[y][x] === colorIdx) {
                    // White pixel
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                } else {
                    // Black pixel
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
                    zip.file(filename, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    });

    await Promise.all(imagePromises);

    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image size: ${width}x${height}
// Pixel height: ${settings.pixelHeight}mm
// Base thickness: ${settings.baseThickness}mm

pixel_size = ${settings.pixelHeight};
base_thickness = ${settings.baseThickness};
image_width = ${width};
image_height = ${height};

module heightmap_layer(image_file, color_rgb) {
    color(color_rgb)
    translate([0, 0, base_thickness])
    scale([pixel_size, pixel_size, pixel_size])
    surface(file = image_file, center = false, invert = true);
}

union() {
    // Base
    color([0.5, 0.5, 0.5])
    cube([image_width * pixel_size, image_height * pixel_size, base_thickness]);
    
    // Color layers
`;

    partList.forEach((part, colorIdx) => {
        const hex = colorEntryToHex(part.target).replace('#', '');
        const r = (parseInt(hex.substring(0, 2), 16) / 255).toFixed(3);
        const g = (parseInt(hex.substring(2, 4), 16) / 255).toFixed(3);
        const b = (parseInt(hex.substring(4, 6), 16) / 255).toFixed(3);
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        scadContent += `    heightmap_layer("${filename}", [${r}, ${g}, ${b}]); // ${part.target.name}\n`;
    });

    scadContent += `}\n`;

    zip.file("model.scad", scadContent);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.zip`);
}

/**
 * Dynamically load JSZip library
 */
async function loadJSZip(): Promise<any> {
    if (typeof (window as any).JSZip !== 'undefined') {
        return (window as any).JSZip;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}

/**
 * Trigger a download of a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Sanitize filename by removing special characters
 */
function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}
