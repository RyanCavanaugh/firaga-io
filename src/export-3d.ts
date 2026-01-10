import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type Export3DSettings = {
    format: "3mf" | "openscad";
    filename: string;
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings.filename);
    } else {
        await exportOpenSCAD(image, settings.filename);
    }
}

async function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MF(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MF(image: PartListImage): string {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create material definitions for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(6);
        const g = (color.g / 255).toFixed(6);
        const b = (color.b / 255).toFixed(6);
        materials.push(`    <base name="${color.name}" displaycolor="#${rgbToHex(color.r, color.g, color.b)}" />`);
    });

    // Create mesh objects for each color
    const pixelSize = 1.0;
    const height = 0.5;
    
    image.partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;

                    // 8 vertices for a cube
                    const baseVertex = vertexCount;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles for a cube (2 per face)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseVertex + 3}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 3}" v2="${baseVertex + 6}" v3="${baseVertex + 2}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 0}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(`  <object id="${partIdx + 1}" name="${part.target.name}" pid="1" pindex="${partIdx}" type="model">
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

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${objects.join('\n')}
    <build>
${image.partList.map((_, idx) => `      <item objectid="${idx + 1}" />`).join('\n')}
    </build>
  </resources>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, filename: string) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one PNG per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const pngData = generateColorMask(image, i);
        zip.file(`${sanitizeFilename(part.target.name)}.png`, pngData, { base64: true });
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCAD(image);
    zip.file(`${filename}.scad`, scadContent);

    // Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${filename}.zip`);
}

function generateColorMask(image: PartListImage, colorIndex: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, image.width, image.height);

    // Draw black pixels for this color
    ctx.fillStyle = 'black';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // Convert to base64 PNG
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1];
}

function generateOpenSCAD(image: PartListImage): string {
    const lines: string[] = [];
    
    lines.push('// Generated by firaga.io');
    lines.push('// OpenSCAD 3D visualization of pixelated image\n');
    lines.push('pixel_size = 1; // Size of each pixel in mm');
    lines.push('height = 0.5;    // Height of each layer in mm\n');
    
    lines.push('union() {');
    
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        lines.push(`  // ${part.target.name}`);
        lines.push(`  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        lines.push(`    surface(file="${sanitizeFilename(part.target.name)}.png", invert=true, center=true)`);
        lines.push(`      scale([pixel_size, pixel_size, height]);`);
        lines.push('');
    });
    
    lines.push('}');
    
    return lines.join('\n');
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

let jsZipPromise: Promise<any> | null = null;

async function loadJSZip(): Promise<any> {
    if (!jsZipPromise) {
        jsZipPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve((window as any).JSZip);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return jsZipPromise;
}
