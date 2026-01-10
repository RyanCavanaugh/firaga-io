import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    baseThickness: number; // Thickness of base layer in mm
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await load3DLibraries();
    
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else if (settings.format === "openscad") {
        generateOpenSCAD(image, settings);
    }
}

async function load3DLibraries() {
    // Load JSZip for creating zip files
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        await new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const pixelSize = 1.0; // 1mm per pixel in X/Y
    const { pixelHeight, baseThickness } = settings;
    
    let vertices = "";
    let triangles = "";
    let vertexCount = 0;
    let triangleCount = 0;
    
    const meshes: { colorName: string; colorHex: string; vertices: string; triangles: string; }[] = [];
    
    // Create a separate mesh for each color
    partList.forEach((part, partIndex) => {
        let colorVertices = "";
        let colorTriangles = "";
        let colorVertexCount = 0;
        
        const colorHex = `#${part.target.r.toString(16).padStart(2, '0')}${part.target.g.toString(16).padStart(2, '0')}${part.target.b.toString(16).padStart(2, '0')}`;
        
        // Build mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseThickness;
                    const z1 = baseThickness + pixelHeight;
                    
                    // 8 vertices of the box
                    const v0 = colorVertexCount++;
                    const v1 = colorVertexCount++;
                    const v2 = colorVertexCount++;
                    const v3 = colorVertexCount++;
                    const v4 = colorVertexCount++;
                    const v5 = colorVertexCount++;
                    const v6 = colorVertexCount++;
                    const v7 = colorVertexCount++;
                    
                    colorVertices += `<vertex x="${x0}" y="${y0}" z="${z0}"/>\n`;
                    colorVertices += `<vertex x="${x1}" y="${y0}" z="${z0}"/>\n`;
                    colorVertices += `<vertex x="${x1}" y="${y1}" z="${z0}"/>\n`;
                    colorVertices += `<vertex x="${x0}" y="${y1}" z="${z0}"/>\n`;
                    colorVertices += `<vertex x="${x0}" y="${y0}" z="${z1}"/>\n`;
                    colorVertices += `<vertex x="${x1}" y="${y0}" z="${z1}"/>\n`;
                    colorVertices += `<vertex x="${x1}" y="${y1}" z="${z1}"/>\n`;
                    colorVertices += `<vertex x="${x0}" y="${y1}" z="${z1}"/>\n`;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    colorTriangles += `<triangle v1="${v0}" v2="${v2}" v3="${v1}"/>\n`;
                    colorTriangles += `<triangle v1="${v0}" v2="${v3}" v3="${v2}"/>\n`;
                    // Top
                    colorTriangles += `<triangle v1="${v4}" v2="${v5}" v3="${v6}"/>\n`;
                    colorTriangles += `<triangle v1="${v4}" v2="${v6}" v3="${v7}"/>\n`;
                    // Front
                    colorTriangles += `<triangle v1="${v0}" v2="${v1}" v3="${v5}"/>\n`;
                    colorTriangles += `<triangle v1="${v0}" v2="${v5}" v3="${v4}"/>\n`;
                    // Back
                    colorTriangles += `<triangle v1="${v2}" v2="${v3}" v3="${v7}"/>\n`;
                    colorTriangles += `<triangle v1="${v2}" v2="${v7}" v3="${v6}"/>\n`;
                    // Left
                    colorTriangles += `<triangle v1="${v3}" v2="${v0}" v3="${v4}"/>\n`;
                    colorTriangles += `<triangle v1="${v3}" v2="${v4}" v3="${v7}"/>\n`;
                    // Right
                    colorTriangles += `<triangle v1="${v1}" v2="${v2}" v3="${v6}"/>\n`;
                    colorTriangles += `<triangle v1="${v1}" v2="${v6}" v3="${v5}"/>\n`;
                }
            }
        }
        
        if (colorVertexCount > 0) {
            meshes.push({
                colorName: part.target.name,
                colorHex: colorHex,
                vertices: colorVertices,
                triangles: colorTriangles
            });
        }
    });
    
    // Build the 3MF XML
    let objectsXml = "";
    meshes.forEach((mesh, index) => {
        objectsXml += `    <object id="${index + 1}" type="model">\n`;
        objectsXml += `      <mesh>\n`;
        objectsXml += `        <vertices>\n`;
        objectsXml += mesh.vertices;
        objectsXml += `        </vertices>\n`;
        objectsXml += `        <triangles>\n`;
        objectsXml += mesh.triangles;
        objectsXml += `        </triangles>\n`;
        objectsXml += `      </mesh>\n`;
        objectsXml += `    </object>\n`;
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXml}
    <build>
${meshes.map((_, index) => `      <item objectid="${index + 1}"/>`).join('\n')}
    </build>
  </resources>
</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseThickness } = settings;
    
    // Create one mask image per color
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    
    const imageFiles: string[] = [];
    
    for (let i = 0; i < partList.length; i++) {
        const part = partList[i];
        const imageData = ctx.createImageData(width, height);
        
        // Create black/white mask
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const isThisColor = pixels[y][x] === i;
                const value = isThisColor ? 255 : 0;
                imageData.data[index] = value;
                imageData.data[index + 1] = value;
                imageData.data[index + 2] = value;
                imageData.data[index + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        const filename = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        imageFiles.push(filename);
        zip.file(filename, base64Data, { base64: true });
    }
    
    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image size: ${width}x${height} pixels
// Pixel height: ${pixelHeight}mm
// Base thickness: ${baseThickness}mm

pixel_size = 1.0; // mm
pixel_height = ${pixelHeight}; // mm
base_thickness = ${baseThickness}; // mm
image_width = ${width};
image_height = ${height};

`;
    
    partList.forEach((part, i) => {
        const colorHex = `#${part.target.r.toString(16).padStart(2, '0')}${part.target.g.toString(16).padStart(2, '0')}${part.target.b.toString(16).padStart(2, '0')}`;
        scadContent += `// Color: ${part.target.name} (${colorHex})\n`;
        scadContent += `color([${part.target.r / 255}, ${part.target.g / 255}, ${part.target.b / 255}])\n`;
        scadContent += `  translate([0, 0, base_thickness])\n`;
        scadContent += `    scale([pixel_size, pixel_size, pixel_height])\n`;
        scadContent += `      surface(file="${imageFiles[i]}", invert=true, center=false);\n\n`;
    });
    
    // Add base
    scadContent += `// Base layer\n`;
    scadContent += `color([0.5, 0.5, 0.5])\n`;
    scadContent += `  cube([image_width * pixel_size, image_height * pixel_size, base_thickness]);\n`;
    
    zip.file("model.scad", scadContent);
    
    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
