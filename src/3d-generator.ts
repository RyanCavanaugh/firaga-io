import { PartListImage } from "./image-utils";

declare const JSZip: typeof import("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
    filename: string;
}

/**
 * Generate and download a 3D file from the part list image
 */
export async function make3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await load3DLibrariesAnd(() => {
        if (settings.format === "3mf") {
            make3MF(image, settings);
        } else {
            makeOpenSCAD(image, settings);
        }
    });
}

async function load3DLibrariesAnd(func: () => void): Promise<void> {
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

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function make3MF(image: PartListImage, settings: ThreeDSettings): void {
    const pitchMm = settings.pitch;
    const heightMm = settings.height;

    // Build the 3D model XML
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;

    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        modelXml += `
      <base name="${escapeXml(color.name)}" displaycolor="${hexColor}" />`;
    }

    modelXml += `
    </basematerials>`;

    // Generate meshes for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const meshId = colorIndex + 2;
        modelXml += `
    <object id="${meshId}" name="${escapeXml(image.partList[colorIndex].target.name)}" type="model" pid="1" pindex="${colorIndex}">
      <mesh>
        <vertices>`;

        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: string[] = [];

        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const baseIdx = vertices.length;
                    const x0 = x * pitchMm;
                    const x1 = (x + 1) * pitchMm;
                    const y0 = y * pitchMm;
                    const y1 = (y + 1) * pitchMm;
                    const z0 = 0;
                    const z1 = heightMm;

                    // Add 8 vertices for the box
                    vertices.push(
                        { x: x0, y: y0, z: z0 },
                        { x: x1, y: y0, z: z0 },
                        { x: x1, y: y1, z: z0 },
                        { x: x0, y: y1, z: z0 },
                        { x: x0, y: y0, z: z1 },
                        { x: x1, y: y0, z: z1 },
                        { x: x1, y: y1, z: z1 },
                        { x: x0, y: y1, z: z1 }
                    );

                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face (z=z1)
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face (y=y0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face (y=y1)
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face (x=x0)
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face (x=x1)
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                }
            }
        }

        // Write vertices
        for (const v of vertices) {
            modelXml += `
          <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}" />`;
        }

        modelXml += `
        </vertices>
        <triangles>`;

        // Write triangles
        for (const tri of triangles) {
            modelXml += `
          ${tri}`;
        }

        modelXml += `
        </triangles>
      </mesh>
    </object>`;
    }

    modelXml += `
  </resources>
  <build>`;

    // Add all objects to the build
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const meshId = colorIndex + 2;
        modelXml += `
    <item objectid="${meshId}" />`;
    }

    modelXml += `
  </build>
</model>`;

    // Create 3MF zip file
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", modelXml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);

    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        downloadBlob(blob, `${settings.filename}.3mf`);
    });
}

/**
 * Generate OpenSCAD masks format (zip with images + .scad file)
 */
function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    const pitchMm = settings.pitch;
    const heightMm = settings.height;

    // Generate one black/white image per color
    const imagePromises: Array<Promise<void>> = [];
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;

        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw black pixels where this color appears
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const colorName = sanitizeFilename(image.partList[colorIndex].target.name);
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`${colorName}.png`, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    }

    // Wait for all images to be added
    Promise.all(imagePromises).then(() => {
        // Generate OpenSCAD file
        let scadContent = `// Generated by firaga.io
// Pixel pitch: ${pitchMm}mm
// Height: ${heightMm}mm

module layer(filename, color) {
  color(color)
  scale([${pitchMm}, ${pitchMm}, ${heightMm}])
  surface(file = filename, center = true, invert = true);
}

`;

        for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
            const color = image.partList[colorIndex].target;
            const colorName = sanitizeFilename(color.name);
            const rgb = [color.r / 255, color.g / 255, color.b / 255];
            scadContent += `layer("${colorName}.png", [${rgb[0].toFixed(3)}, ${rgb[1].toFixed(3)}, ${rgb[2].toFixed(3)}]);\n`;
        }

        zip.file("model.scad", scadContent);

        zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
            downloadBlob(blob, `${settings.filename}.zip`);
        });
    });
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = n.toString(16).toUpperCase();
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
    return name.replace(/[^a-zA-Z0-9-_]/g, "_");
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
