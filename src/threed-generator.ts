import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const JSZip: any;

export function generate3MF(image: PartListImage, filename: string, pitch: number) {
    const xml = create3MFContent(image, pitch);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function create3MFContent(image: PartListImage, pitch: number): string {
    const height = 2.0; // Height of each pixel in mm
    let vertexId = 1;
    let triangleId = 1;
    
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <basematerials:base name="${part.target.name}" displaycolor="#${hex}" />`);
    });
    
    // Create a separate mesh object for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        
        // Find all pixels of this color and create cubes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a small cube for this pixel
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = x0 + pitch;
                    const y1 = y0 + pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the cube
                    const baseId = localVertexId;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    localVertexId += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseId}" v2="${baseId + 2}" v3="${baseId + 1}" />`);
                    triangles.push(`      <triangle v1="${baseId}" v2="${baseId + 3}" v3="${baseId + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseId + 4}" v2="${baseId + 5}" v3="${baseId + 6}" />`);
                    triangles.push(`      <triangle v1="${baseId + 4}" v2="${baseId + 6}" v3="${baseId + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseId}" v2="${baseId + 1}" v3="${baseId + 5}" />`);
                    triangles.push(`      <triangle v1="${baseId}" v2="${baseId + 5}" v3="${baseId + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseId + 3}" v2="${baseId + 7}" v3="${baseId + 6}" />`);
                    triangles.push(`      <triangle v1="${baseId + 3}" v2="${baseId + 6}" v3="${baseId + 2}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseId}" v2="${baseId + 4}" v3="${baseId + 7}" />`);
                    triangles.push(`      <triangle v1="${baseId}" v2="${baseId + 7}" v3="${baseId + 3}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseId + 1}" v2="${baseId + 2}" v3="${baseId + 6}" />`);
                    triangles.push(`      <triangle v1="${baseId + 1}" v2="${baseId + 6}" v3="${baseId + 5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${colorIndex + 2}" name="${part.target.name}" type="model">
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
    
    const buildItems = image.partList.map((part, idx) => 
        `    <item objectid="${idx + 2}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

export async function generateOpenSCADZip(image: PartListImage, filename: string, pitch: number) {
    // Load JSZip if not already loaded
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one monochrome image per color
    image.partList.forEach((part, colorIndex) => {
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
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(`mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
    });
    
    // Create OpenSCAD file
    const scadContent = createOpenSCADContent(image, pitch);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download zip
    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        saveAs(content, `${filename}_openscad.zip`);
    });
}

function createOpenSCADContent(image: PartListImage, pitch: number): string {
    const lines: string[] = [];
    
    lines.push('// Generated by firaga.io');
    lines.push('');
    lines.push(`width = ${image.width};`);
    lines.push(`height = ${image.height};`);
    lines.push(`pitch = ${pitch};`);
    lines.push(`layer_height = 2;`);
    lines.push('');
    
    lines.push('union() {');
    
    image.partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        lines.push(`  // ${part.target.name}`);
        lines.push(`  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]) {`);
        lines.push(`    translate([0, 0, ${colorIndex * 0.1}])`);
        lines.push(`    scale([pitch, pitch, layer_height])`);
        lines.push(`    surface(file = "mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png", center = false, invert = true);`);
        lines.push(`  }`);
        lines.push('');
    });
    
    lines.push('}');
    
    return lines.join('\n');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error('Failed to load JSZip'));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
