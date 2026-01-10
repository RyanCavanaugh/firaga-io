import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    pixelHeight: number; // Height in mm for 3D extrusion
    pixelSize: number; // Width/height of each pixel in mm
    baseHeight: number; // Height of base layer in mm
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { pixelHeight, pixelSize, baseHeight } = settings;
    
    // Generate 3MF XML content
    let meshId = 1;
    const objects: string[] = [];
    
    // Create mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels with this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices of the box
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    const v = baseIdx;
                    // Bottom face
                    triangles.push([v+0, v+2, v+1], [v+0, v+3, v+2]);
                    // Top face
                    triangles.push([v+4, v+5, v+6], [v+4, v+6, v+7]);
                    // Front face
                    triangles.push([v+0, v+1, v+5], [v+0, v+5, v+4]);
                    // Back face
                    triangles.push([v+2, v+3, v+7], [v+2, v+7, v+6]);
                    // Left face
                    triangles.push([v+0, v+4, v+7], [v+0, v+7, v+3]);
                    // Right face
                    triangles.push([v+1, v+2, v+6], [v+1, v+6, v+5]);
                }
            }
        }
        
        if (vertices.length === 0) continue;
        
        // Build mesh XML
        const vertexXml = vertices.map(v => `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`).join('\n');
        const triangleXml = triangles.map(t => `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`).join('\n');
        
        const r = color.target.r;
        const g = color.target.g;
        const b = color.target.b;
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        
        objects.push(`  <object id="${meshId}" type="model">
    <mesh>
      <vertices>
${vertexXml}
      </vertices>
      <triangles>
${triangleXml}
      </triangles>
    </mesh>
  </object>`);
        
        meshId++;
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;
    
    // Create 3MF package (ZIP file with specific structure)
    const zip = await createZipFile();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "model.3mf");
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const { pixelHeight, pixelSize, baseHeight } = settings;
    const zip = await createZipFile();
    
    // Generate one mask image per color
    const imageFiles: string[] = [];
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
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
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`;
        imageFiles.push(filename);
        zip.file(filename, blob);
    }
    
    // Generate OpenSCAD file
    const scadCode = generateOpenSCADCode(image, imageFiles, settings);
    zip.file("model.scad", scadCode);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "openscad_model.zip");
}

function generateOpenSCADCode(image: PartListImage, imageFiles: string[], settings: ThreeDSettings): string {
    const { pixelHeight, pixelSize, baseHeight } = settings;
    const width = image.width * pixelSize;
    const height = image.height * pixelSize;
    
    let code = `// Generated OpenSCAD model from firaga.io
// Image dimensions: ${image.width}x${image.height} pixels
// Pixel size: ${pixelSize}mm
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

`;
    
    code += `module color_layer(image_file, color) {
    color(color)
    scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])
    surface(file=image_file, center=true, invert=true);
}

`;
    
    code += `union() {\n`;
    
    // Add base layer
    if (baseHeight > 0) {
        code += `    // Base layer
    color([0.8, 0.8, 0.8])
    translate([0, 0, ${baseHeight / 2}])
    cube([${width}, ${height}, ${baseHeight}], center=true);
    
`;
    }
    
    // Add each color layer
    for (let i = 0; i < imageFiles.length; i++) {
        const color = image.partList[i].target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        code += `    // ${color.name}
    translate([0, 0, ${baseHeight + pixelHeight / 2}])
    color_layer("${imageFiles[i]}", [${r}, ${g}, ${b}]);
    
`;
    }
    
    code += `}\n`;
    
    return code;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

// Simple ZIP file creation using JSZip-like API
// We need to load JSZip dynamically
async function createZipFile(): Promise<any> {
    // Load JSZip from CDN if not already loaded
    if (!(window as any).JSZip) {
        await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }
    
    return new (window as any).JSZip();
}
