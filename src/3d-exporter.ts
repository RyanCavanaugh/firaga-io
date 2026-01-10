import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

/**
 * Export a PartListImage as a 3MF file with triangle mesh
 * Each color becomes a separate material and object
 */
export function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Export a PartListImage as a ZIP file containing:
 * - Monochrome images (one per color)
 * - OpenSCAD file that loads images using heightmap
 */
export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    // We'll need JSZip for this
    // For now, load it from CDN if not available
    await loadJSZip();
    
    const zip = new (window as any).JSZip();
    
    // Generate one monochrome image per color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i];
        const maskImage = generateMaskImage(image, i);
        zip.file(`color_${i}_${sanitizeFilename(color.target.name)}.png`, maskImage.split(',')[1], { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate the ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

/**
 * Generate 3MF XML content for the image
 */
function generate3MFContent(image: PartListImage): string {
    const pixelHeight = 1.0; // Height of each pixel in mm
    const pixelSize = 2.5; // Size of each pixel in mm (width/depth)
    
    let vertexId = 1;
    let triangleId = 1;
    const objects: string[] = [];
    
    // Create one object per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        
        // Find all pixels of this color and create cubes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const baseX = x * pixelSize;
                    const baseY = y * pixelSize;
                    const baseZ = 0;
                    
                    // 8 vertices for a cube
                    const cubeVertices = [
                        [baseX, baseY, baseZ],
                        [baseX + pixelSize, baseY, baseZ],
                        [baseX + pixelSize, baseY + pixelSize, baseZ],
                        [baseX, baseY + pixelSize, baseZ],
                        [baseX, baseY, baseZ + pixelHeight],
                        [baseX + pixelSize, baseY, baseZ + pixelHeight],
                        [baseX + pixelSize, baseY + pixelSize, baseZ + pixelHeight],
                        [baseX, baseY + pixelSize, baseZ + pixelHeight],
                    ];
                    
                    const vStart = localVertexId;
                    cubeVertices.forEach(([vx, vy, vz]) => {
                        vertices.push(`<vertex x="${vx}" y="${vy}" z="${vz}" />`);
                        localVertexId++;
                    });
                    
                    // 12 triangles for a cube (2 per face, 6 faces)
                    const cubeFaces = [
                        // Bottom
                        [vStart + 0, vStart + 2, vStart + 1],
                        [vStart + 0, vStart + 3, vStart + 2],
                        // Top
                        [vStart + 4, vStart + 5, vStart + 6],
                        [vStart + 4, vStart + 6, vStart + 7],
                        // Front
                        [vStart + 0, vStart + 1, vStart + 5],
                        [vStart + 0, vStart + 5, vStart + 4],
                        // Back
                        [vStart + 2, vStart + 3, vStart + 7],
                        [vStart + 2, vStart + 7, vStart + 6],
                        // Left
                        [vStart + 0, vStart + 4, vStart + 7],
                        [vStart + 0, vStart + 7, vStart + 3],
                        // Right
                        [vStart + 1, vStart + 2, vStart + 6],
                        [vStart + 1, vStart + 6, vStart + 5],
                    ];
                    
                    cubeFaces.forEach(([v1, v2, v3]) => {
                        triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v3}" />`);
                    });
                }
            }
        }
        
        if (vertices.length > 0) {
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            
            objects.push(`
    <object id="${colorIndex + 1}" name="${escapeXml(color.target.name)}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    const buildItems = objects.map((_, i) => 
        `      <item objectid="${i + 1}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

/**
 * Generate a monochrome (black/white) PNG image for a specific color index
 * Returns a data URL
 */
function generateMaskImage(image: PartListImage, colorIndex: number): string {
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
    
    return canvas.toDataURL('image/png');
}

/**
 * Generate OpenSCAD file content
 */
function generateOpenSCADFile(image: PartListImage): string {
    const pixelSize = 2.5; // Size in mm
    const layerHeight = 1.0; // Height of each layer in mm
    
    let scadCode = `// OpenSCAD file for pixel art 3D display
// Image dimensions: ${image.width} x ${image.height}
// Pixel size: ${pixelSize}mm

`;
    
    // Add color definitions
    scadCode += `// Color definitions\n`;
    image.partList.forEach((color, i) => {
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        scadCode += `color_${i} = [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]; // ${color.target.name}\n`;
    });
    
    scadCode += `\n// Pixel size and layer height\npixel_size = ${pixelSize};\nlayer_height = ${layerHeight};\n\n`;
    
    // Union all the color layers
    scadCode += `union() {\n`;
    
    image.partList.forEach((color, i) => {
        const filename = `color_${i}_${sanitizeFilename(color.target.name)}.png`;
        scadCode += `  color(color_${i}) {\n`;
        scadCode += `    translate([0, 0, ${i * layerHeight}]) {\n`;
        scadCode += `      surface(file = "${filename}", center = true, invert = true);\n`;
        scadCode += `    }\n`;
        scadCode += `  }\n`;
    });
    
    scadCode += `}\n`;
    
    return scadCode;
}

/**
 * Load JSZip library from CDN
 */
async function loadJSZip(): Promise<void> {
    if ((window as any).JSZip) {
        return;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}

/**
 * Helper functions
 */
function toHex(n: number): string {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
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
