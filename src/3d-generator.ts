import { PartListImage } from "./image-utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    height: number; // Height in mm
    baseThickness: number; // Base thickness in mm
    pixelSize: number; // Size of each pixel in mm
};

/**
 * Generate a 3D model file from the image
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate 3MF file with triangle mesh and color materials
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const { height: modelHeight, baseThickness, pixelSize } = settings;

    // Build 3MF XML structure
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXml += '  <resources>\n';

    // Define materials (colors)
    modelXml += '    <basematerials id="1">\n';
    partList.forEach((part, idx) => {
        const { r, g, b } = part.target;
        const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        modelXml += `      <base name="${escapeXml(part.target.name)}" displaycolor="${colorHex}" />\n`;
    });
    modelXml += '    </basematerials>\n';

    // Create mesh object for each color
    let objectId = 2;
    const objectIds: number[] = [];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Build geometry for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseThickness + modelHeight;

                    // Define 8 vertices of the cube
                    vertices.push(
                        [x0, y0, z0], // 0
                        [x1, y0, z0], // 1
                        [x1, y1, z0], // 2
                        [x0, y1, z0], // 3
                        [x0, y0, z1], // 4
                        [x1, y0, z1], // 5
                        [x1, y1, z1], // 6
                        [x0, y1, z1]  // 7
                    );

                    // Define 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back
                    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6]);
                    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2]);
                    // Left
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            modelXml += `    <object id="${objectId}" type="model">\n`;
            modelXml += `      <mesh>\n`;
            modelXml += `        <vertices>\n`;
            vertices.forEach(([x, y, z]) => {
                modelXml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
            });
            modelXml += `        </vertices>\n`;
            modelXml += `        <triangles>\n`;
            triangles.forEach(([v1, v2, v3]) => {
                modelXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />\n`;
            });
            modelXml += `        </triangles>\n`;
            modelXml += `      </mesh>\n`;
            modelXml += `    </object>\n`;

            objectIds.push(objectId);
            objectId++;
        }
    }

    modelXml += '  </resources>\n';
    modelXml += '  <build>\n';
    objectIds.forEach(id => {
        modelXml += `    <item objectid="${id}" />\n`;
    });
    modelXml += '  </build>\n';
    modelXml += '</model>\n';

    // Create 3MF package (ZIP with specific structure)
    const zip = await createZip();
    await zip.file("3D/3dmodel.model", modelXml);
    await zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    await zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);

    const blob = await zip.generateBlob();
    downloadBlob(blob, "model.3mf");
}

/**
 * Generate OpenSCAD masks format (ZIP with images and .scad file)
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const { height: modelHeight, baseThickness, pixelSize } = settings;

    const zip = await createZip();

    // Create one black/white PNG for each color
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isPixel = pixels[y][x] === colorIdx;
                const value = isPixel ? 255 : 0;
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const blob = await canvasToBlob(canvas);
        await zip.file(`mask_${colorIdx}_${sanitizeFilename(partList[colorIdx].target.name)}.png`, blob);
    }

    // Generate OpenSCAD file
    let scadCode = `// Generated by firaga.io
// Image dimensions: ${width}x${height}
// Pixel size: ${pixelSize}mm

$fn = 20;

`;

    scadCode += `module pixel_layer(mask_file, color_rgb) {
    color(color_rgb)
    linear_extrude(height=${modelHeight})
    scale([${pixelSize}, ${pixelSize}, 1])
    surface(file=mask_file, center=false, invert=true);
}

`;

    scadCode += `// Base layer\n`;
    scadCode += `color([0.5, 0.5, 0.5])\n`;
    scadCode += `cube([${width * pixelSize}, ${height * pixelSize}, ${baseThickness}]);\n\n`;

    scadCode += `// Color layers\n`;
    scadCode += `translate([0, 0, ${baseThickness}]) {\n`;
    partList.forEach((part, idx) => {
        const { r, g, b } = part.target;
        const colorRgb = `[${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}]`;
        scadCode += `    pixel_layer("mask_${idx}_${sanitizeFilename(part.target.name)}.png", ${colorRgb}); // ${part.target.name}\n`;
    });
    scadCode += `}\n`;

    await zip.file("model.scad", scadCode);

    const blob = await zip.generateBlob();
    downloadBlob(blob, "model-openscad.zip");
}

// Helper functions

function toHex(n: number): string {
    return n.toString(16).padStart(2, "0").toUpperCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob from canvas"));
            }
        }, "image/png");
    });
}

// Simple ZIP implementation using JSZip-like interface
interface ZipFile {
    file(path: string, content: string | Blob): Promise<void>;
    generateBlob(): Promise<Blob>;
}

async function createZip(): Promise<ZipFile> {
    // Load JSZip dynamically
    await loadJSZip();
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();
    return {
        async file(path: string, content: string | Blob) {
            zip.file(path, content);
        },
        async generateBlob() {
            return await zip.generateAsync({ type: "blob" });
        }
    };
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl !== null) {
        return; // Already loaded
    }

    return new Promise((resolve, reject) => {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => resolve();
        tag.onerror = () => reject(new Error("Failed to load JSZip"));
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    });
}
