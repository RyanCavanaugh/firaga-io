import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    baseThickness: number; // Thickness of base layer in mm
}

/**
 * Generate and download 3D export in the specified format
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, index) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        materials.push(`    <base:material id="${index + 1}" name="${escapeXml(color.name)}" color="#${hex}" />`);
    });
    
    // Create mesh objects for each color
    image.partList.forEach((part, index) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === index) {
                    // Create a box for this pixel
                    const box = createBox(x, y, settings.pixelHeight, settings.baseThickness);
                    vertices.push(...box.vertices.map(v => 
                        `      <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`
                    ));
                    
                    // Add triangles with offset vertex indices
                    triangles.push(...box.triangles.map(t => 
                        `      <triangle v1="${t.v1 + vertexIndex}" v2="${t.v2 + vertexIndex}" v3="${t.v3 + vertexIndex}" />`
                    ));
                    
                    vertexIndex += box.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${index + 2}" type="model" materialid="${index + 1}">
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
    
    // Build complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
  <basematerials id="1">
${materials.join('\n')}
  </basematerials>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, i) => `    <item objectid="${i + 2}" />`).join('\n')}
  </build>
</model>`;
    
    // Create ZIP file (3MF is a ZIP archive)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", getContentTypesXml());
    zip.file("_rels/.rels", getRelsXml());
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

/**
 * Create a box mesh for a single pixel
 */
function createBox(x: number, y: number, height: number, baseThickness: number): {
    vertices: Array<{ x: number; y: number; z: number }>;
    triangles: Array<{ v1: number; v2: number; v3: number }>;
} {
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = 0;
    const z1 = height + baseThickness;
    
    const vertices = [
        // Bottom face
        { x: x0, y: y0, z: z0 }, // 0
        { x: x1, y: y0, z: z0 }, // 1
        { x: x1, y: y1, z: z0 }, // 2
        { x: x0, y: y1, z: z0 }, // 3
        // Top face
        { x: x0, y: y0, z: z1 }, // 4
        { x: x1, y: y0, z: z1 }, // 5
        { x: x1, y: y1, z: z1 }, // 6
        { x: x0, y: y1, z: z1 }, // 7
    ];
    
    const triangles = [
        // Bottom face (z = 0)
        { v1: 0, v2: 2, v3: 1 },
        { v1: 0, v2: 3, v3: 2 },
        // Top face (z = z1)
        { v1: 4, v2: 5, v3: 6 },
        { v1: 4, v2: 6, v3: 7 },
        // Front face (y = y0)
        { v1: 0, v2: 1, v3: 5 },
        { v1: 0, v2: 5, v3: 4 },
        // Back face (y = y1)
        { v1: 2, v2: 3, v3: 7 },
        { v1: 2, v2: 7, v3: 6 },
        // Left face (x = x0)
        { v1: 3, v2: 0, v3: 4 },
        { v1: 3, v2: 4, v3: 7 },
        // Right face (x = x1)
        { v1: 1, v2: 2, v3: 6 },
        { v1: 1, v2: 6, v3: 5 },
    ];
    
    return { vertices, triangles };
}

/**
 * Generate OpenSCAD masks format (ZIP with PNG masks + .scad file)
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    const scadLines: string[] = [];
    
    scadLines.push(`// Generated by firaga.io`);
    scadLines.push(`// Image: ${settings.filename}`);
    scadLines.push(`pixel_size = 1; // mm per pixel`);
    scadLines.push(`pixel_height = ${settings.pixelHeight}; // mm`);
    scadLines.push(`base_thickness = ${settings.baseThickness}; // mm`);
    scadLines.push(``);
    scadLines.push(`module color_layer(image_file, color) {`);
    scadLines.push(`  color(color)`);
    scadLines.push(`  scale([pixel_size, pixel_size, pixel_height])`);
    scadLines.push(`  surface(file=image_file, center=true, invert=true);`);
    scadLines.push(`}`);
    scadLines.push(``);
    scadLines.push(`union() {`);
    
    // Generate PNG mask for each color
    const canvasPromises = image.partList.map(async (part, index) => {
        const filename = `color_${index}_${sanitizeFilename(part.target.name)}.png`;
        const canvas = createMaskCanvas(image, index);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => {
                resolve(b!);
            }, 'image/png');
        });
        
        zip.file(filename, blob);
        
        // Add to OpenSCAD file
        const hex = colorEntryToHex(part.target);
        return `  color_layer("${filename}", "${hex}");`;
    });
    
    const colorLayers = await Promise.all(canvasPromises);
    scadLines.push(...colorLayers);
    scadLines.push(`}`);
    
    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

/**
 * Create a monochrome PNG canvas for a specific color index
 */
function createMaskCanvas(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const i = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 255 : 0; // White for filled, black for empty
            
            imageData.data[i] = value;     // R
            imageData.data[i + 1] = value; // G
            imageData.data[i + 2] = value; // B
            imageData.data[i + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}
