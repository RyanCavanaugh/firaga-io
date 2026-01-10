import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
}

/**
 * Generate and download 3D output in the specified format
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings.filename);
    } else if (settings.format === "openscad-masks") {
        generateOpenSCADMasks(image, settings.filename);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function generate3MF(image: PartListImage, filename: string): void {
    const xml = create3MFContent(image);
    downloadFile(xml, `${filename}.3mf`, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function create3MFContent(image: PartListImage): string {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color in the part list
    image.partList.forEach((part, index) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove '#'
        materials.push(`    <base:material materialid="${index}" displaycolor="${hex}" />`);
    });

    // Create separate mesh objects for each color
    image.partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create a unit cube at position (x, y, 0) with height 1
                    const baseVertex = vertexIndex;
                    
                    // 8 vertices of the cube
                    vertices.push(`      <vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y}" z="1" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="1" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="1" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="1" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`      <triangle v1="${baseVertex}" v2="${baseVertex + 2}" v3="${baseVertex + 1}" />`);
                    triangles.push(`      <triangle v1="${baseVertex}" v2="${baseVertex + 3}" v3="${baseVertex + 2}" />`);
                    // Top face (z=1)
                    triangles.push(`      <triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`);
                    // Front face (y=0)
                    triangles.push(`      <triangle v1="${baseVertex}" v2="${baseVertex + 1}" v3="${baseVertex + 5}" />`);
                    triangles.push(`      <triangle v1="${baseVertex}" v2="${baseVertex + 5}" v3="${baseVertex + 4}" />`);
                    // Back face (y=1)
                    triangles.push(`      <triangle v1="${baseVertex + 2}" v2="${baseVertex + 3}" v3="${baseVertex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    // Left face (x=0)
                    triangles.push(`      <triangle v1="${baseVertex}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseVertex}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />`);
                    // Right face (x=1)
                    triangles.push(`      <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(`  <object id="${partIndex + 1}" materialid="${partIndex}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });

    // Build components list
    const components = objects.map((_, idx) => `      <component objectid="${idx + 1}" />`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="0">
${materials.join('\n')}
    </basematerials>
${objects.join('\n')}
    <object id="${objects.length + 1}" type="model">
      <components>
${components}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${objects.length + 1}" />
  </build>
</model>`;

    return xml;
}

/**
 * Generate a ZIP file containing OpenSCAD masks
 */
async function generateOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    // We'll need JSZip for this - check if it's available
    if (typeof (window as any).JSZip === 'undefined') {
        await loadJSZip();
    }

    const JSZip = (window as any).JSZip;
    const zip = new JSZip();

    const scadLines: string[] = [];
    scadLines.push(`// Generated by firaga.io`);
    scadLines.push(`// Image: ${filename}`);
    scadLines.push(`// Dimensions: ${image.width}x${image.height}`);
    scadLines.push(``);

    // Generate one PNG per color
    image.partList.forEach((part, partIndex) => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Create black/white mask
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === partIndex;
                const value = isThisColor ? 0 : 255; // Black for filled, white for empty
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob and add to zip
        const dataUrl = maskCanvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const maskFilename = `mask_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(maskFilename, base64Data, { base64: true });

        // Add OpenSCAD code for this layer
        const colorHex = colorEntryToHex(part.target);
        scadLines.push(`// Color: ${part.target.name} (${colorHex})`);
        scadLines.push(`color("${colorHex}")`);
        scadLines.push(`  surface(file = "${maskFilename}", center = true, invert = true);`);
        scadLines.push(``);
    });

    // Add the .scad file to the zip
    zip.file(`${filename}.scad`, scadLines.join('\n'));

    // Generate and download the zip
    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        downloadBlob(content, `${filename}.zip`);
    });
}

/**
 * Load JSZip library from CDN
 */
function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const existingScript = document.getElementById(tagName);
        
        if (existingScript) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.id = tagName;
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        document.head.appendChild(script);
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
