import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad';

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base in mm
}

/**
 * Generate and download a 3D file from the image
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    if (settings.format === '3mf') {
        generate3MF(image, settings, filename);
    } else {
        generateOpenSCAD(image, settings, filename);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // 3MF uses millimeters as the unit
    const pixelSize = 1.0; // 1mm per pixel width/depth
    
    let meshId = 2; // Start from 2 (1 is reserved for base)
    const objects: string[] = [];
    const resources: string[] = [];
    
    // Generate base material
    resources.push(`    <basematerials id="1">`);
    
    partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        resources.push(`      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`);
    });
    
    resources.push(`    </basematerials>`);
    
    // Generate mesh for each color
    partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    const startIdx = vertices.length;
                    
                    // 8 vertices of the box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]); // bottom
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); // top
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push([startIdx + 0, startIdx + 2, startIdx + 1]);
                    triangles.push([startIdx + 0, startIdx + 3, startIdx + 2]);
                    // Top face (z1)
                    triangles.push([startIdx + 4, startIdx + 5, startIdx + 6]);
                    triangles.push([startIdx + 4, startIdx + 6, startIdx + 7]);
                    // Front face (y0)
                    triangles.push([startIdx + 0, startIdx + 1, startIdx + 5]);
                    triangles.push([startIdx + 0, startIdx + 5, startIdx + 4]);
                    // Back face (y1)
                    triangles.push([startIdx + 2, startIdx + 3, startIdx + 7]);
                    triangles.push([startIdx + 2, startIdx + 7, startIdx + 6]);
                    // Left face (x0)
                    triangles.push([startIdx + 0, startIdx + 4, startIdx + 7]);
                    triangles.push([startIdx + 0, startIdx + 7, startIdx + 3]);
                    // Right face (x1)
                    triangles.push([startIdx + 1, startIdx + 2, startIdx + 6]);
                    triangles.push([startIdx + 1, startIdx + 6, startIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            let mesh = `    <mesh>\n`;
            mesh += `      <vertices>\n`;
            vertices.forEach(([x, y, z]) => {
                mesh += `        <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
            });
            mesh += `      </vertices>\n`;
            mesh += `      <triangles>\n`;
            triangles.forEach(([v1, v2, v3]) => {
                mesh += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
            });
            mesh += `      </triangles>\n`;
            mesh += `    </mesh>\n`;
            
            resources.push(`    <object id="${meshId}" type="model">\n${mesh}    </object>`);
            objects.push(`    <item objectid="${meshId}" partnumber="${escapeXml(part.target.name)}" />`);
            meshId++;
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${objects.join('\n')}
  </build>
</model>`;
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Generate an OpenSCAD masks format (zip with images + .scad file)
 */
async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // We'll need JSZip for this
    await loadJSZip();
    
    const zip = new (window as any).JSZip();
    
    // Generate one black/white image per color
    partList.forEach((part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const safeFilename = part.target.name.replace(/[^a-z0-9_-]/gi, '_');
        zip.file(`${safeFilename}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image: ${filename}
// Size: ${width}x${height} pixels

pixel_size = 1.0; // mm per pixel
pixel_height = ${pixelHeight}; // mm height for colored pixels
base_height = ${baseHeight}; // mm base height

module create_layer(image_file, color) {
    color(color)
    translate([0, 0, base_height])
    linear_extrude(height = pixel_height)
    scale([pixel_size, pixel_size])
    surface(file = image_file, center = false, invert = true);
}

union() {
    // Base
    color([0.5, 0.5, 0.5])
    cube([${width} * pixel_size, ${height} * pixel_size, base_height]);
    
    // Color layers
`;
    
    partList.forEach((part) => {
        const safeFilename = part.target.name.replace(/[^a-z0-9_-]/gi, '_');
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        scadContent += `    create_layer("${safeFilename}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);\n`;
    });
    
    scadContent += `}
`;
    
    zip.file('model.scad', scadContent);
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${filename}_openscad.zip`);
}

/**
 * Load JSZip library dynamically
 */
function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).JSZip) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
