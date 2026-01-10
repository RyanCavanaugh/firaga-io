import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export type ThreeDFormat = '3mf' | 'openscad';

export interface ThreeDSettings {
    format: ThreeDFormat;
    height: number; // Height in mm for the 3D representation
    pixelSize: number; // Size of each pixel in mm
}

export function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string) {
    if (settings.format === '3mf') {
        generate3MF(image, settings, filename);
    } else {
        generateOpenSCADMasks(image, settings, filename);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const pixelSize = settings.pixelSize;
    const pixelHeight = settings.height;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        xml += `\n      <base name="${escapeXml(part.target.name)}" displaycolor="${hexColor}" />`;
    });
    
    xml += `\n    </basematerials>\n`;
    
    // Create mesh objects for each color
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and generate cubes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    addCube(x, y, vertices, triangles, pixelSize, pixelHeight);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${colorIdx + 2}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });
    
    xml += `  </resources>\n  <build>\n`;
    
    // Reference all objects in the build
    partList.forEach((_, colorIdx) => {
        xml += `    <item objectid="${colorIdx + 2}" />\n`;
    });
    
    xml += `  </build>\n</model>`;
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function addCube(
    x: number, 
    y: number, 
    vertices: Array<[number, number, number]>, 
    triangles: Array<[number, number, number]>,
    size: number,
    height: number
) {
    const baseIdx = vertices.length;
    const x0 = x * size;
    const y0 = y * size;
    const x1 = (x + 1) * size;
    const y1 = (y + 1) * size;
    const z0 = 0;
    const z1 = height;
    
    // 8 vertices of a cube
    vertices.push(
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
    );
    
    // 12 triangles (2 per face, 6 faces)
    // Bottom
    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
    // Top
    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
    // Front
    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
    // Back
    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6]);
    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2]);
    // Left
    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
    // Right
    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const pixelSize = settings.pixelSize;
    const pixelHeight = settings.height;
    
    // Create a zip file using JSZip would be ideal, but we'll create a simple implementation
    // For now, we'll create individual files and package them
    const JSZip = (window as any).JSZip;
    
    if (!JSZip) {
        // Fallback: download files separately
        alert('Creating individual files. For a zip archive, include JSZip library.');
        generateOpenSCADMasksIndividual(image, settings, filename);
        return;
    }
    
    const zip = new JSZip();
    
    // Generate one image per color
    partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (transparent in heightmap)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black where this color exists
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Add PNG to zip
        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.split(',')[1];
        zip.file(`color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`, base64, { base64: true });
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for ${filename}\n\n`;
    scadContent += `pixel_size = ${pixelSize};\n`;
    scadContent += `pixel_height = ${pixelHeight};\n\n`;
    
    partList.forEach((part, colorIdx) => {
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  surface(file = "color_${colorIdx}_${sanitizeFilename(part.target.name)}.png", center = false, invert = true);\n\n`;
    });
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download zip
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, `${filename}_openscad.zip`);
    });
}

function generateOpenSCADMasksIndividual(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const pixelSize = settings.pixelSize;
    const pixelHeight = settings.height;
    
    // Generate OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for ${filename}\n\n`;
    scadContent += `pixel_size = ${pixelSize};\n`;
    scadContent += `pixel_height = ${pixelHeight};\n\n`;
    
    partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Download individual PNG
        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${filename}_color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`);
            }
        });
        
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  surface(file = "${filename}_color_${colorIdx}_${sanitizeFilename(part.target.name)}.png", center = false, invert = true);\n\n`;
    });
    
    const blob = new Blob([scadContent], { type: 'text/plain' });
    saveAs(blob, `${filename}.scad`);
}

function toHex(n: number): string {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

function escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}
