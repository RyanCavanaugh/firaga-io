import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number; // Height of each pixel in mm
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MF(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;

    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        xml += `            <base name="${escapeXml(color.name)}" displaycolor="${hexColor}" />\n`;
    }

    xml += `        </basematerials>\n`;

    // Generate separate mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Create a cube for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * settings.pitch;
                    const y0 = y * settings.pitch;
                    const x1 = (x + 1) * settings.pitch;
                    const y1 = (y + 1) * settings.pitch;
                    const z0 = 0;
                    const z1 = settings.height;

                    // Add 8 vertices for the cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    const base = vertexIndex;
                    // Bottom face (z=0)
                    triangles.push(`<triangle v1="${base + 0}" v2="${base + 2}" v3="${base + 1}" />`);
                    triangles.push(`<triangle v1="${base + 0}" v2="${base + 3}" v3="${base + 2}" />`);
                    // Top face (z=z1)
                    triangles.push(`<triangle v1="${base + 4}" v2="${base + 5}" v3="${base + 6}" />`);
                    triangles.push(`<triangle v1="${base + 4}" v2="${base + 6}" v3="${base + 7}" />`);
                    // Front face (y=y0)
                    triangles.push(`<triangle v1="${base + 0}" v2="${base + 1}" v3="${base + 5}" />`);
                    triangles.push(`<triangle v1="${base + 0}" v2="${base + 5}" v3="${base + 4}" />`);
                    // Back face (y=y1)
                    triangles.push(`<triangle v1="${base + 2}" v2="${base + 3}" v3="${base + 7}" />`);
                    triangles.push(`<triangle v1="${base + 2}" v2="${base + 7}" v3="${base + 6}" />`);
                    // Left face (x=x0)
                    triangles.push(`<triangle v1="${base + 3}" v2="${base + 0}" v3="${base + 4}" />`);
                    triangles.push(`<triangle v1="${base + 3}" v2="${base + 4}" v3="${base + 7}" />`);
                    // Right face (x=x1)
                    triangles.push(`<triangle v1="${base + 1}" v2="${base + 2}" v3="${base + 6}" />`);
                    triangles.push(`<triangle v1="${base + 1}" v2="${base + 6}" v3="${base + 5}" />`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            xml += `        <object id="${colorIndex + 2}" type="model" materialid="1" materialprop="${colorIndex}">\n`;
            xml += `            <mesh>\n`;
            xml += `                <vertices>\n`;
            xml += vertices.map(v => `                    ${v}`).join('\n') + '\n';
            xml += `                </vertices>\n`;
            xml += `                <triangles>\n`;
            xml += triangles.map(t => `                    ${t}`).join('\n') + '\n';
            xml += `                </triangles>\n`;
            xml += `            </mesh>\n`;
            xml += `        </object>\n`;
        }
    }

    xml += `    </resources>\n`;
    xml += `    <build>\n`;

    // Add all non-empty objects to the build
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        // Check if this color has any pixels
        let hasPixels = false;
        for (let y = 0; y < image.height && !hasPixels; y++) {
            for (let x = 0; x < image.width && !hasPixels; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    hasPixels = true;
                }
            }
        }
        if (hasPixels) {
            xml += `        <item objectid="${colorIndex + 2}" />\n`;
        }
    }

    xml += `    </build>\n`;
    xml += `</model>`;

    return xml;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one mask image per color
    const imagePromises: Promise<void>[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
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
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const filename = `mask_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
                    zip.file(filename, blob);
                }
                resolve();
            }, 'image/png');
        });
        
        imagePromises.push(promise);
    }
    
    await Promise.all(imagePromises);

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate zip file
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${settings.filename}.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    let scad = `// Generated OpenSCAD file for ${image.width}x${image.height} image\n`;
    scad += `// Pitch: ${settings.pitch}mm, Height: ${settings.height}mm\n\n`;
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex].target;
        const filename = `mask_${colorIndex}_${sanitizeFilename(color.name)}.png`;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        
        scad += `// ${color.name} (${hexColor})\n`;
        scad += `color("${hexColor}")\n`;
        scad += `translate([0, 0, ${colorIndex * settings.height}])\n`;
        scad += `scale([${settings.pitch}, ${settings.pitch}, ${settings.height}])\n`;
        scad += `surface(file = "${filename}", center = false, invert = true);\n\n`;
    }
    
    return scad;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<typeof import("jszip")> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    } else {
        return (window as any).JSZip;
    }
}
