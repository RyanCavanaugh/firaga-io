import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
    baseHeight: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad") {
        await makeOpenSCAD(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with separate material shapes for each color
    const { pitch, height, baseHeight } = settings;
    
    // Build the 3MF XML structure
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = Math.round(color.r);
        const g = Math.round(color.g);
        const b = Math.round(color.b);
        modelXml += `
      <base name="${escapeXml(color.name)}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />`;
    });
    
    modelXml += `
    </basematerials>`;
    
    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    addCube(vertices, triangles, x * pitch, y * pitch, baseHeight, pitch, pitch, height);
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXml += `
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>`;
            
            vertices.forEach(v => {
                modelXml += `
          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`;
            });
            
            modelXml += `
        </vertices>
        <triangles>`;
            
            triangles.forEach(t => {
                modelXml += `
          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />`;
            });
            
            modelXml += `
        </triangles>
      </mesh>
    </object>`;
            objectIds.push(objectId);
            objectId++;
        }
    }
    
    // Create build items
    modelXml += `
  </resources>
  <build>`;
    
    objectIds.forEach(id => {
        modelXml += `
    <item objectid="${id}" />`;
    });
    
    modelXml += `
  </build>
</model>`;
    
    // Create the 3MF package (it's a ZIP file)
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Add required files
    zip.file("3D/3dmodel.model", modelXml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`);
    
    // Generate and save the file
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "model.3mf");
}

function addCube(
    vertices: Array<[number, number, number]>, 
    triangles: Array<[number, number, number]>,
    x: number, y: number, z: number,
    w: number, h: number, d: number
) {
    const baseIdx = vertices.length;
    
    // Add 8 vertices for the cube
    vertices.push(
        [x, y, z],         // 0
        [x + w, y, z],     // 1
        [x + w, y + h, z], // 2
        [x, y + h, z],     // 3
        [x, y, z + d],     // 4
        [x + w, y, z + d], // 5
        [x + w, y + h, z + d], // 6
        [x, y + h, z + d]  // 7
    );
    
    // Add 12 triangles (2 per face)
    // Bottom face (z)
    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 2]);
    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 3]);
    
    // Top face (z + d)
    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 5]);
    triangles.push([baseIdx + 4, baseIdx + 7, baseIdx + 6]);
    
    // Front face (y)
    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 5]);
    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 1]);
    
    // Back face (y + h)
    triangles.push([baseIdx + 2, baseIdx + 6, baseIdx + 7]);
    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 3]);
    
    // Left face (x)
    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 7]);
    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 4]);
    
    // Right face (x + w)
    triangles.push([baseIdx + 1, baseIdx + 5, baseIdx + 6]);
    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 2]);
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { pitch, height, baseHeight } = settings;
    
    // Generate one black/white image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
    }
    
    // Generate the OpenSCAD file
    let scadContent = `// Generated 3D model from firaga.io
// Pitch: ${pitch}mm
// Height: ${height}mm
// Base height: ${baseHeight}mm

module color_layer(image_file, color) {
    color(color)
    translate([0, 0, ${baseHeight}])
    linear_extrude(height = ${height})
    scale([${pitch}, ${pitch}, 1])
    surface(file = image_file, invert = true, center = false);
}

`;
    
    // Add each color layer
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        scadContent += `color_layer("${filename}", [${r}, ${g}, ${b}]);\n`;
    }
    
    zip.file("model.scad", scadContent);
    
    // Generate and save the ZIP file
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "openscad_model.zip");
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_');
}

// Dynamically load JSZip
let jsZipPromise: Promise<any> | null = null;

async function loadJSZip(): Promise<any> {
    if (jsZipPromise) {
        return jsZipPromise;
    }
    
    jsZipPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
    
    return jsZipPromise;
}
