import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number; // height in mm for each pixel
    pixelSize: number; // width/depth in mm for each pixel
    baseHeight: number; // height of base layer in mm
}

export async function generate3DFile(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error("Failed to load JSZip"));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve();
        }
    });
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Create 3MF content
    const model3MF = generate3MFModel(image, settings);
    
    // Add required 3MF files
    zip.file("3D/3dmodel.model", model3MF);
    zip.file("[Content_Types].xml", getContentTypesXML());
    zip.file("_rels/.rels", getRelsXML());
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, pixelSize, baseHeight } = settings;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    let meshId = 1;
    const objectIds: number[] = [];
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        const pixels: Array<[number, number]> = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    pixels.push([x, y]);
                }
            }
        }
        
        if (pixels.length === 0) continue;
        
        // Create vertices and triangles for each pixel
        for (const [px, py] of pixels) {
            const baseIdx = vertices.length;
            const x0 = px * pixelSize;
            const x1 = (px + 1) * pixelSize;
            const y0 = py * pixelSize;
            const y1 = (py + 1) * pixelSize;
            const z0 = baseHeight;
            const z1 = baseHeight + pixelHeight;
            
            // 8 vertices for a cube
            vertices.push(
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
            );
            
            // 12 triangles (2 per face, 6 faces)
            const faces = [
                [0, 1, 2], [0, 2, 3], // bottom
                [4, 6, 5], [4, 7, 6], // top
                [0, 4, 5], [0, 5, 1], // front
                [1, 5, 6], [1, 6, 2], // right
                [2, 6, 7], [2, 7, 3], // back
                [3, 7, 4], [3, 4, 0]  // left
            ];
            
            for (const [a, b, c] of faces) {
                triangles.push([baseIdx + a, baseIdx + b, baseIdx + c]);
            }
        }
        
        // Write mesh
        xml += `    <object id="${meshId}" type="model">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';
        for (const [x, y, z] of vertices) {
            xml += `          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
        }
        xml += '        </vertices>\n';
        xml += '        <triangles>\n';
        for (const [v1, v2, v3] of triangles) {
            xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        }
        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += `    </object>\n`;
        
        objectIds.push(meshId);
        meshId++;
    }
    
    // Build component that combines all objects
    xml += `    <object id="${meshId}" type="model">\n`;
    xml += '      <components>\n';
    for (const objId of objectIds) {
        xml += `        <component objectid="${objId}" />\n`;
    }
    xml += '      </components>\n';
    xml += '    </object>\n';
    
    xml += '  </resources>\n';
    xml += `  <build>\n`;
    xml += `    <item objectid="${meshId}" />\n`;
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function getContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Generate one PNG mask per color
    const maskPromises: Promise<void>[] = [];
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const promise = generateMaskForColor(image, colorIdx).then(maskData => {
            zip.file(`color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`, maskData);
        });
        maskPromises.push(promise);
    }
    
    // Wait for all masks to be generated
    await Promise.all(maskPromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad-model.zip");
}

function generateMaskForColor(image: PartListImage, colorIdx: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white (transparent areas)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Fill pixels of this color with black
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to generate mask image"));
            }
        }, "image/png");
    });
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, pixelSize, baseHeight } = settings;
    
    let scad = "// Generated by firaga.io\n";
    scad += "// 3D model from pixel art\n\n";
    
    scad += `pixel_size = ${pixelSize}; // mm per pixel\n`;
    scad += `pixel_height = ${pixelHeight}; // mm height per pixel\n`;
    scad += `base_height = ${baseHeight}; // mm base layer height\n`;
    scad += `img_width = ${image.width};\n`;
    scad += `img_height = ${image.height};\n\n`;
    
    scad += "union() {\n";
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const filename = `color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`;
        const hexColor = colorEntryToHex(color.target);
        
        scad += `  // ${color.target.name} (${color.count} pixels)\n`;
        scad += `  color("${hexColor}")\n`;
        scad += `  translate([0, 0, base_height])\n`;
        scad += `  scale([pixel_size, pixel_size, pixel_height])\n`;
        scad += `  surface(file = "${filename}", center = false, invert = true);\n\n`;
    }
    
    scad += "}\n";
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
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
