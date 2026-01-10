import { PartListImage } from "./image-utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    height: number; // Height in mm for 3D extrusion
    baseHeight: number; // Base layer height in mm
}

/**
 * Generate 3D output file
 */
export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZipAnd(() => {
        if (settings.format === "3mf") {
            make3MF(image, settings);
        } else {
            makeOpenSCADMasks(image, settings);
        }
    });
}

async function loadJSZipAnd(func: () => void) {
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
 * Generate 3MF file (3D Manufacturing Format)
 * Creates separate triangle mesh shapes for each color
 */
async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const pixelSize = 2.5; // mm per pixel (artkal mini size)
    
    // Build the 3MF XML structure
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXml += '  <resources>\n';
    
    let objectId = 1;
    const objectIds: number[] = [];
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: { x: number, y: number, z: number }[] = [];
        const triangles: { v1: number, v2: number, v3: number }[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create box geometry for each
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.height;
                    
                    // Add 8 vertices for the box
                    const baseIdx = vertexCount;
                    vertices.push(
                        { x: x0, y: y0, z: z0 }, // 0
                        { x: x1, y: y0, z: z0 }, // 1
                        { x: x1, y: y1, z: z0 }, // 2
                        { x: x0, y: y1, z: z0 }, // 3
                        { x: x0, y: y0, z: z1 }, // 4
                        { x: x1, y: y0, z: z1 }, // 5
                        { x: x1, y: y1, z: z1 }, // 6
                        { x: x0, y: y1, z: z1 }  // 7
                    );
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 2, v3: baseIdx + 1 });
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 3, v3: baseIdx + 2 });
                    // Top face
                    triangles.push({ v1: baseIdx + 4, v2: baseIdx + 5, v3: baseIdx + 6 });
                    triangles.push({ v1: baseIdx + 4, v2: baseIdx + 6, v3: baseIdx + 7 });
                    // Front face
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 1, v3: baseIdx + 5 });
                    triangles.push({ v1: baseIdx + 0, v2: baseIdx + 5, v3: baseIdx + 4 });
                    // Back face
                    triangles.push({ v1: baseIdx + 2, v2: baseIdx + 3, v3: baseIdx + 7 });
                    triangles.push({ v1: baseIdx + 2, v2: baseIdx + 7, v3: baseIdx + 6 });
                    // Left face
                    triangles.push({ v1: baseIdx + 3, v2: baseIdx + 0, v3: baseIdx + 4 });
                    triangles.push({ v1: baseIdx + 3, v2: baseIdx + 4, v3: baseIdx + 7 });
                    // Right face
                    triangles.push({ v1: baseIdx + 1, v2: baseIdx + 2, v3: baseIdx + 6 });
                    triangles.push({ v1: baseIdx + 1, v2: baseIdx + 6, v3: baseIdx + 5 });
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            // Add mesh object for this color
            modelXml += `    <object id="${objectId}" type="model">\n`;
            modelXml += `      <mesh>\n`;
            modelXml += `        <vertices>\n`;
            
            for (const v of vertices) {
                modelXml += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
            }
            
            modelXml += `        </vertices>\n`;
            modelXml += `        <triangles>\n`;
            
            for (const t of triangles) {
                modelXml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
            }
            
            modelXml += `        </triangles>\n`;
            modelXml += `      </mesh>\n`;
            modelXml += `    </object>\n`;
            
            objectIds.push(objectId);
            objectId++;
        }
    }
    
    // Create build item that references all objects
    modelXml += '  </resources>\n';
    modelXml += '  <build>\n';
    for (const id of objectIds) {
        modelXml += `    <item objectid="${id}" />\n`;
    }
    modelXml += '  </build>\n';
    modelXml += '</model>\n';
    
    // Create the 3MF package (it's a ZIP file with specific structure)
    const zip = new JSZip() as any;
    zip.file("3D/3dmodel.model", modelXml);
    
    // Add required _rels and Content_Types files
    const relsXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n' +
        '</Relationships>';
    zip.file("_rels/.rels", relsXml);
    
    const contentTypesXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n' +
        '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n' +
        '</Types>';
    zip.file("[Content_Types].xml", contentTypesXml);
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

/**
 * Generate OpenSCAD masks format
 * Creates a ZIP with monochrome images per color and an OpenSCAD file
 */
async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip() as any;
    
    // Create a canvas for rendering mask images
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    
    const maskFiles: string[] = [];
    const colorNames: string[] = [];
    const colors: { r: number, g: number, b: number }[] = [];
    
    // Generate a mask image for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Create black/white mask (white = this color, black = other)
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelIdx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                const value = isThisColor ? 255 : 0;
                
                imageData.data[pixelIdx] = value;     // R
                imageData.data[pixelIdx + 1] = value; // G
                imageData.data[pixelIdx + 2] = value; // B
                imageData.data[pixelIdx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const filename = `mask_${colorIdx}_${sanitizeFilename(color.target.name)}.png`;
        zip.file(filename, blob);
        maskFiles.push(filename);
        colorNames.push(color.target.name);
        colors.push({ r: color.target.r, g: color.target.g, b: color.target.b });
    }
    
    // Generate OpenSCAD file
    let scadCode = `// Generated by firaga.io
// 3D representation of pixel art image
// Each color is loaded as a heightmap and combined

pixel_size = 2.5; // mm per pixel
base_height = ${settings.baseHeight}; // mm
layer_height = ${settings.height}; // mm

`;
    
    // Add module for each color layer
    for (let i = 0; i < maskFiles.length; i++) {
        const rgbNormalized = `[${(colors[i].r / 255).toFixed(3)}, ${(colors[i].g / 255).toFixed(3)}, ${(colors[i].b / 255).toFixed(3)}]`;
        scadCode += `// ${colorNames[i]}\n`;
        scadCode += `module layer_${i}() {\n`;
        scadCode += `    color(${rgbNormalized})\n`;
        scadCode += `    translate([0, 0, base_height])\n`;
        scadCode += `    scale([pixel_size, pixel_size, layer_height])\n`;
        scadCode += `    surface(file = "${maskFiles[i]}", center = false, invert = true);\n`;
        scadCode += `}\n\n`;
    }
    
    // Combine all layers
    scadCode += `// Combine all layers\n`;
    scadCode += `union() {\n`;
    for (let i = 0; i < maskFiles.length; i++) {
        scadCode += `    layer_${i}();\n`;
    }
    scadCode += `}\n`;
    
    zip.file("model.scad", scadCode);
    
    // Add README
    const readme = `3D Pixel Art Model - OpenSCAD Format
Generated by firaga.io

Files included:
- model.scad: OpenSCAD script to generate the 3D model
${maskFiles.map((f, i) => `- ${f}: Mask for ${colorNames[i]}`).join('\n')}

To use:
1. Install OpenSCAD (https://openscad.org/)
2. Open model.scad in OpenSCAD
3. Press F5 to preview or F6 to render
4. Export to STL for 3D printing

Settings:
- Pixel size: 2.5mm (Artkal Mini beads)
- Base height: ${settings.baseHeight}mm
- Layer height: ${settings.height}mm
`;
    
    zip.file("README.txt", readme);
    
    // Generate and download the ZIP file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model-openscad.zip");
}

/**
 * Trigger download of a blob
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}
