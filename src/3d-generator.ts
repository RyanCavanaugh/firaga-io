import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    heightPerLayer: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings.heightPerLayer);
    } else {
        await makeOpenSCADZip(image, settings.heightPerLayer);
    }
}

async function make3MF(image: PartListImage, heightPerLayer: number) {
    const xml = generate3MFContent(image, heightPerLayer);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, "model.3mf");
}

function generate3MFContent(image: PartListImage, heightPerLayer: number): string {
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXml += '  <resources>\n';
    
    // Define materials for each color
    modelXml += '    <basematerials id="1">\n';
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        modelXml += `      <base name="${color.name}" displaycolor="${hexColor}" />\n`;
    }
    modelXml += '    </basematerials>\n';
    
    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: Array<{x: number, y: number, z: number}> = [];
        const triangles: Array<{v1: number, v2: number, v3: number}> = [];
        
        // Find all pixels of this color and create cubes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseZ = colorIndex * heightPerLayer;
                    addCubeToMesh(vertices, triangles, x, y, baseZ, 1, 1, heightPerLayer);
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXml += `    <object id="${objectId}" type="model">\n`;
            modelXml += '      <mesh>\n';
            modelXml += '        <vertices>\n';
            for (const v of vertices) {
                modelXml += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
            }
            modelXml += '        </vertices>\n';
            modelXml += '        <triangles>\n';
            for (const t of triangles) {
                modelXml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${colorIndex}" />\n`;
            }
            modelXml += '        </triangles>\n';
            modelXml += '      </mesh>\n';
            modelXml += '    </object>\n';
            objectIds.push(objectId);
            objectId++;
        }
    }
    
    modelXml += '  </resources>\n';
    modelXml += '  <build>\n';
    for (const id of objectIds) {
        modelXml += `    <item objectid="${id}" />\n`;
    }
    modelXml += '  </build>\n';
    modelXml += '</model>\n';
    
    return modelXml;
}

function addCubeToMesh(
    vertices: Array<{x: number, y: number, z: number}>,
    triangles: Array<{v1: number, v2: number, v3: number}>,
    x: number, y: number, z: number,
    width: number, depth: number, height: number
) {
    const baseIndex = vertices.length;
    
    // 8 vertices of a cube
    vertices.push(
        { x: x, y: y, z: z },                           // 0
        { x: x + width, y: y, z: z },                   // 1
        { x: x + width, y: y + depth, z: z },           // 2
        { x: x, y: y + depth, z: z },                   // 3
        { x: x, y: y, z: z + height },                  // 4
        { x: x + width, y: y, z: z + height },          // 5
        { x: x + width, y: y + depth, z: z + height },  // 6
        { x: x, y: y + depth, z: z + height }           // 7
    );
    
    // 12 triangles (2 per face, 6 faces)
    // Bottom face (z = z)
    triangles.push({ v1: baseIndex + 0, v2: baseIndex + 2, v3: baseIndex + 1 });
    triangles.push({ v1: baseIndex + 0, v2: baseIndex + 3, v3: baseIndex + 2 });
    
    // Top face (z = z + height)
    triangles.push({ v1: baseIndex + 4, v2: baseIndex + 5, v3: baseIndex + 6 });
    triangles.push({ v1: baseIndex + 4, v2: baseIndex + 6, v3: baseIndex + 7 });
    
    // Front face (y = y)
    triangles.push({ v1: baseIndex + 0, v2: baseIndex + 1, v3: baseIndex + 5 });
    triangles.push({ v1: baseIndex + 0, v2: baseIndex + 5, v3: baseIndex + 4 });
    
    // Back face (y = y + depth)
    triangles.push({ v1: baseIndex + 2, v2: baseIndex + 3, v3: baseIndex + 7 });
    triangles.push({ v1: baseIndex + 2, v2: baseIndex + 7, v3: baseIndex + 6 });
    
    // Left face (x = x)
    triangles.push({ v1: baseIndex + 0, v2: baseIndex + 4, v3: baseIndex + 7 });
    triangles.push({ v1: baseIndex + 0, v2: baseIndex + 7, v3: baseIndex + 3 });
    
    // Right face (x = x + width)
    triangles.push({ v1: baseIndex + 1, v2: baseIndex + 2, v3: baseIndex + 6 });
    triangles.push({ v1: baseIndex + 1, v2: baseIndex + 6, v3: baseIndex + 5 });
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex.toUpperCase();
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function makeOpenSCADZip(image: PartListImage, heightPerLayer: number) {
    // We need JSZip for this
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Create one PNG image per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Fill pixels of this color with black
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        const colorName = sanitizeFilename(image.partList[colorIndex].target.name);
        zip.file(`layer_${colorIndex}_${colorName}.png`, blob);
    }
    
    // Create the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, heightPerLayer);
    zip.file('model.scad', scadContent);
    
    // Generate and download the zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'openscad_model.zip');
}

function generateOpenSCADFile(image: PartListImage, heightPerLayer: number): string {
    let scad = '// Generated OpenSCAD file for layered image\n\n';
    
    for (let i = 0; i < image.partList.length; i++) {
        const colorName = sanitizeFilename(image.partList[i].target.name);
        const color = image.partList[i].target;
        const zOffset = i * heightPerLayer;
        
        scad += `// Layer ${i}: ${image.partList[i].target.name}\n`;
        scad += `color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])\n`;
        scad += `translate([0, 0, ${zOffset}])\n`;
        scad += `linear_extrude(height = ${heightPerLayer})\n`;
        scad += `scale([1, 1, 1])\n`;
        scad += `surface(file = "layer_${i}_${colorName}.png", center = false, invert = true);\n\n`;
    }
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<typeof import("jszip")> {
    // Load JSZip from CDN if not already loaded
    if (!(window as any).JSZip) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
    }
    return (window as any).JSZip;
}
