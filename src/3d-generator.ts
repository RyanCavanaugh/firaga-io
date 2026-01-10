import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as FileSaver from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        make3MF(image, settings);
    } else {
        makeOpenSCAD(image, settings);
    }
}

function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MF(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    FileSaver.saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Build materials section
    let materialsXml = '';
    let objectsXml = '';
    let buildItemsXml = '';
    
    partList.forEach((part, index) => {
        const color = colorEntryToHex(part.target);
        const rgb = hexToRgb(color);
        materialsXml += `    <basematerials:base name="${part.target.name}" displaycolor="${rgb}" />\n`;
    });
    
    // Create separate meshes for each color
    partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a cube for this pixel
                    const cubeVerts = createCube(x, y, baseHeight, pixelHeight);
                    const baseIndex = vertexIndex;
                    
                    cubeVerts.vertices.forEach(v => {
                        vertices.push(`      <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`);
                    });
                    
                    cubeVerts.faces.forEach(f => {
                        triangles.push(`      <triangle v1="${baseIndex + f[0]}" v2="${baseIndex + f[1]}" v3="${baseIndex + f[2]}" />`);
                    });
                    
                    vertexIndex += cubeVerts.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            objectsXml += `  <object id="${partIndex + 2}" type="model" pid="1" pindex="${partIndex}">\n`;
            objectsXml += `    <mesh>\n`;
            objectsXml += `      <vertices>\n${vertices.join('\n')}\n      </vertices>\n`;
            objectsXml += `      <triangles>\n${triangles.join('\n')}\n      </triangles>\n`;
            objectsXml += `    </mesh>\n`;
            objectsXml += `  </object>\n`;
            
            buildItemsXml += `    <item objectid="${partIndex + 2}" />\n`;
        }
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materialsXml}    </basematerials:basematerials>
${objectsXml}  </resources>
  <build>
${buildItemsXml}  </build>
</model>`;
}

function createCube(x: number, y: number, baseZ: number, height: number) {
    const x0 = x, x1 = x + 1;
    const y0 = y, y1 = y + 1;
    const z0 = baseZ, z1 = baseZ + height;
    
    const vertices = [
        { x: x0, y: y0, z: z0 }, // 0
        { x: x1, y: y0, z: z0 }, // 1
        { x: x1, y: y1, z: z0 }, // 2
        { x: x0, y: y1, z: z0 }, // 3
        { x: x0, y: y0, z: z1 }, // 4
        { x: x1, y: y0, z: z1 }, // 5
        { x: x1, y: y1, z: z1 }, // 6
        { x: x0, y: y1, z: z1 }, // 7
    ];
    
    const faces = [
        // Bottom
        [0, 2, 1], [0, 3, 2],
        // Top
        [4, 5, 6], [4, 6, 7],
        // Front
        [0, 1, 5], [0, 5, 4],
        // Back
        [2, 3, 7], [2, 7, 6],
        // Left
        [3, 0, 4], [3, 4, 7],
        // Right
        [1, 2, 6], [1, 6, 5],
    ];
    
    return { vertices, faces };
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `#${result[1]}${result[2]}${result[3]}`;
    }
    return "#808080";
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Create a mask image for each color
    partList.forEach((part, partIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(`color_${partIndex}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
    });
    
    // Create the OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image dimensions: ${width}x${height}
// Base height: ${baseHeight}mm
// Pixel height: ${pixelHeight}mm

`;
    
    partList.forEach((part, partIndex) => {
        const color = colorEntryToHex(part.target);
        const rgb = hexToRgbArray(color);
        const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        
        scadContent += `// ${part.target.name}
color([${rgb[0]}, ${rgb[1]}, ${rgb[2]}]) {
    surface(file = "${filename}", center = true, invert = true);
    scale([1, 1, ${pixelHeight}]) {
        linear_extrude(height = 1) {
            projection(cut = false) {
                surface(file = "${filename}", center = true, invert = true);
            }
        }
    }
}

`;
    });
    
    // Add base
    scadContent += `// Base
translate([0, 0, -${baseHeight}]) {
    cube([${width}, ${height}, ${baseHeight}], center = true);
}
`;
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and save the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(blob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function hexToRgbArray(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ];
    }
    return [0.5, 0.5, 0.5];
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
