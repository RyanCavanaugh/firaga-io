import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

function load3DLibrary(callback: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            callback();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        callback();
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    load3DLibrary(() => generate3MFWorker(image, settings));
}

function generate3MFWorker(image: PartListImage, settings: ThreeDSettings) {
    // 3MF is an XML-based format
    // Create a triangle mesh for each color
    const xml = create3MFDocument(image);
    
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = settings.filename.replace(/\.[^.]+$/, "") + ".3mf";
    a.click();
    URL.revokeObjectURL(url);
}

function create3MFDocument(image: PartListImage): string {
    const height = 1.0; // Height of each pixel in 3D space
    const pixelSize = 1.0; // Size of each pixel
    
    let meshId = 1;
    const objectsXML: string[] = [];
    const resourcesXML: string[] = [];
    const buildItemsXML: string[] = [];
    
    // Create base colors for each part
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const color = part.target;
        const colorHex = colorEntryToHex(color).substring(1); // Remove #
        
        resourcesXML.push(`    <basematerials id="${i + 1}">`);
        resourcesXML.push(`      <base name="${color.name}" displaycolor="#${colorHex}" />`);
        resourcesXML.push(`    </basematerials>`);
    }
    
    // Create mesh for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create a cube for this pixel
                    const baseIndex = vertexIndex;
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = x0 + pixelSize;
                    const y1 = y0 + pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 2}" v3="${baseIndex + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 3}" v3="${baseIndex + 2}" />`);
                    // Top face (z1)
                    triangles.push(`      <triangle v1="${baseIndex + 4}" v2="${baseIndex + 5}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 4}" v2="${baseIndex + 6}" v3="${baseIndex + 7}" />`);
                    // Front face (y0)
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 1}" v3="${baseIndex + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 5}" v3="${baseIndex + 4}" />`);
                    // Back face (y1)
                    triangles.push(`      <triangle v1="${baseIndex + 3}" v2="${baseIndex + 7}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 3}" v2="${baseIndex + 6}" v3="${baseIndex + 2}" />`);
                    // Left face (x0)
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 4}" v3="${baseIndex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 7}" v3="${baseIndex + 3}" />`);
                    // Right face (x1)
                    triangles.push(`      <triangle v1="${baseIndex + 1}" v2="${baseIndex + 2}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 1}" v2="${baseIndex + 6}" v3="${baseIndex + 5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objectsXML.push(`    <object id="${meshId}" type="model">`);
            objectsXML.push(`      <mesh>`);
            objectsXML.push(`        <vertices>`);
            objectsXML.push(...vertices);
            objectsXML.push(`        </vertices>`);
            objectsXML.push(`        <triangles>`);
            objectsXML.push(...triangles);
            objectsXML.push(`        </triangles>`);
            objectsXML.push(`      </mesh>`);
            objectsXML.push(`    </object>`);
            
            buildItemsXML.push(`    <item objectid="${meshId}" />`);
            meshId++;
        }
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resourcesXML.join('\n')}
${objectsXML.join('\n')}
  </resources>
  <build>
${buildItemsXML.join('\n')}
  </build>
</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    load3DLibrary(() => generateOpenSCADWorker(image, settings));
}

function generateOpenSCADWorker(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create a monochrome image for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        const filename = sanitizeFilename(part.target.name) + ".png";
        zip.file(filename, base64Data, { base64: true });
    }
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file("model.scad", scadContent);
    
    // Generate and download zip
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = settings.filename.replace(/\.[^.]+$/, "") + "_openscad.zip";
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateOpenSCADFile(image: PartListImage): string {
    const lines: string[] = [];
    
    lines.push("// Generated OpenSCAD file for pixel art");
    lines.push("// Each color layer is loaded from a heightmap image");
    lines.push("");
    lines.push("pixel_size = 1;");
    lines.push("layer_height = 1;");
    lines.push(`image_width = ${image.width};`);
    lines.push(`image_height = ${image.height};`);
    lines.push("");
    
    lines.push("union() {");
    
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const filename = sanitizeFilename(part.target.name) + ".png";
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        lines.push(`  // ${part.target.name}`);
        lines.push(`  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        lines.push(`  translate([0, 0, ${partIndex * 0}])`);
        lines.push(`  scale([pixel_size, pixel_size, layer_height])`);
        lines.push(`  surface(file = "${filename}", center = false, invert = true);`);
        lines.push("");
    }
    
    lines.push("}");
    
    return lines.join("\n");
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
