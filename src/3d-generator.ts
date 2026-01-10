import { PartListImage } from "./image-utils";
import { saveAs } from 'file-saver';

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        make3MF(image, settings);
    } else {
        makeOpenSCADMasks(image, settings);
    }
}

function make3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with triangle mesh
    // 3MF is a 3D printing format based on XML
    
    const models: string[] = [];
    let objectId = 1;
    
    // Create a separate mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: { x: number, y: number, z: number }[] = [];
        const triangles: { v1: number, v2: number, v3: number }[] = [];
        
        // For each pixel of this color, create a cube (12 triangles, 8 vertices)
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseVertex = vertices.length;
                    
                    // Add 8 vertices for the cube
                    // Bottom face
                    vertices.push({ x: x, y: y, z: 0 });
                    vertices.push({ x: x + 1, y: y, z: 0 });
                    vertices.push({ x: x + 1, y: y + 1, z: 0 });
                    vertices.push({ x: x, y: y + 1, z: 0 });
                    // Top face
                    vertices.push({ x: x, y: y, z: 1 });
                    vertices.push({ x: x + 1, y: y, z: 1 });
                    vertices.push({ x: x + 1, y: y + 1, z: 1 });
                    vertices.push({ x: x, y: y + 1, z: 1 });
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push({ v1: baseVertex + 0, v2: baseVertex + 2, v3: baseVertex + 1 });
                    triangles.push({ v1: baseVertex + 0, v2: baseVertex + 3, v3: baseVertex + 2 });
                    // Top face (z=1)
                    triangles.push({ v1: baseVertex + 4, v2: baseVertex + 5, v3: baseVertex + 6 });
                    triangles.push({ v1: baseVertex + 4, v2: baseVertex + 6, v3: baseVertex + 7 });
                    // Front face (y=0)
                    triangles.push({ v1: baseVertex + 0, v2: baseVertex + 1, v3: baseVertex + 5 });
                    triangles.push({ v1: baseVertex + 0, v2: baseVertex + 5, v3: baseVertex + 4 });
                    // Back face (y=1)
                    triangles.push({ v1: baseVertex + 2, v2: baseVertex + 3, v3: baseVertex + 7 });
                    triangles.push({ v1: baseVertex + 2, v2: baseVertex + 7, v3: baseVertex + 6 });
                    // Left face (x=0)
                    triangles.push({ v1: baseVertex + 0, v2: baseVertex + 4, v3: baseVertex + 7 });
                    triangles.push({ v1: baseVertex + 0, v2: baseVertex + 7, v3: baseVertex + 3 });
                    // Right face (x=1)
                    triangles.push({ v1: baseVertex + 1, v2: baseVertex + 2, v3: baseVertex + 6 });
                    triangles.push({ v1: baseVertex + 1, v2: baseVertex + 6, v3: baseVertex + 5 });
                }
            }
        }
        
        if (vertices.length > 0) {
            const verticesXml = vertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n        ');
            const trianglesXml = triangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n        ');
            
            const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
            
            models.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
        ${verticesXml}
        </vertices>
        <triangles>
        ${trianglesXml}
        </triangles>
      </mesh>
    </object>
    <basematerials id="${objectId + 1000}">
      <base name="${color.target.name}" displaycolor="${colorHex}" />
    </basematerials>`);
            
            objectId++;
        }
    }
    
    const buildItems = models.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${models.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
    
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    // Create ZIP file with mask images and OpenSCAD file
    const JSZip = (window as any).JSZip;
    
    if (!JSZip) {
        // Load JSZip if not already loaded
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => makeOpenSCADMasksWorker(image, settings);
        document.head.appendChild(script);
    } else {
        makeOpenSCADMasksWorker(image, settings);
    }
}

async function makeOpenSCADMasksWorker(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();
    
    // Create a mask image for each color
    const scadCommands: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        
        // Create a canvas for this color's mask
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeName = sanitizeFilename(color.target.name);
        const filename = `mask_${colorIndex}_${safeName}.png`;
        zip.file(filename, blob);
        
        // Add OpenSCAD command for this layer
        const colorRgb = [color.target.r / 255, color.target.g / 255, color.target.b / 255];
        scadCommands.push(`// ${color.target.name}
color([${colorRgb[0].toFixed(3)}, ${colorRgb[1].toFixed(3)}, ${colorRgb[2].toFixed(3)}])
  translate([0, 0, ${colorIndex}])
    surface(file = "${filename}", center = true, invert = true);`);
    }
    
    // Create the OpenSCAD file
    const scadContent = `// Generated from ${settings.filename}
// Image dimensions: ${image.width} x ${image.height}

scale_factor = 1; // Adjust this to change the overall size
layer_height = 1; // Height of each color layer

${scadCommands.join('\n\n')}
`;
    
    zip.file(`${sanitizeFilename(settings.filename)}.scad`, scadContent);
    
    // Generate and download the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
