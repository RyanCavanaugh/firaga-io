import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, index) => {
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        xml += `      <base name="${escapeXml(part.target.name)}" displaycolor="${hexColor}" />\n`;
    });

    xml += `    </basematerials>\n`;

    // Create mesh objects for each color
    image.partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;

                    const baseIdx = vertexIndex;
                    
                    // Bottom face vertices (z=0)
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    
                    // Top face vertices (z=height)
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // Bottom face (2 triangles)
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    
                    // Top face (2 triangles)
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    
                    // Side faces (4 sides, 2 triangles each)
                    // Front
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Right
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    // Back
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx}" v3="${baseIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${partIndex + 2}" type="model" name="${escapeXml(part.target.name)}">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            xml += vertices.join('\n') + '\n';
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            xml += triangles.join('\n') + '\n';
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });

    xml += `  </resources>\n`;
    xml += `  <build>\n`;

    // Add all color objects to the build
    image.partList.forEach((part, partIndex) => {
        xml += `    <item objectid="${partIndex + 2}" />\n`;
    });

    xml += `  </build>\n`;
    xml += `</model>\n`;

    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate a black/white PNG for each color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const sanitizedName = sanitizeFilename(part.target.name);
        zip.file(`mask_${i}_${sanitizedName}.png`, blob);
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    let scad = `// Generated by firaga.io
// OpenSCAD file for 3D pixelart

`;

    scad += `pixel_pitch = ${pitch}; // mm per pixel\n`;
    scad += `pixel_height = ${height}; // mm height\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;

    scad += `module color_layer(filename, color_rgb) {\n`;
    scad += `  color(color_rgb)\n`;
    scad += `  linear_extrude(height = pixel_height)\n`;
    scad += `  scale([pixel_pitch, pixel_pitch, 1])\n`;
    scad += `  surface(file = filename, center = false, invert = true);\n`;
    scad += `}\n\n`;

    scad += `union() {\n`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        const sanitizedName = sanitizeFilename(part.target.name);
        scad += `  color_layer("mask_${i}_${sanitizedName}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]); // ${part.target.name}\n`;
    }
    
    scad += `}\n`;

    return scad;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<any> {
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
