import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: '3mf' | 'openscad-masks';
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base layer in mm
};

/**
 * Generate a 3MF file with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, settings: ThreeDSettings): Blob {
    const pixelSize = 2.5; // mm per pixel (standard for mini beads)
    const { pixelHeight, baseHeight } = settings;
    
    const xml: string[] = [];
    
    // 3MF header
    xml.push('<?xml version="1.0" encoding="UTF-8"?>');
    xml.push('<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">');
    xml.push('  <resources>');
    
    // Define materials for each color
    xml.push('    <basematerials id="1">');
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        // Convert hex to RGB values (0-1 range for 3MF)
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        xml.push(`      <base name="${escapeXml(part.target.name)}" displaycolor="${hex.slice(1)}" />`);
    });
    xml.push('    </basematerials>');
    
    let objectId = 2;
    const objectIds: number[] = [];
    
    // Create a mesh object for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Add vertices for a box at this position
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseHeight + pixelHeight;
                    
                    const vOffset = vertices.length;
                    
                    // 8 vertices of a box
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
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push({ v1: vOffset + 0, v2: vOffset + 2, v3: vOffset + 1 });
                    triangles.push({ v1: vOffset + 0, v2: vOffset + 3, v3: vOffset + 2 });
                    
                    // Top face (z=z1)
                    triangles.push({ v1: vOffset + 4, v2: vOffset + 5, v3: vOffset + 6 });
                    triangles.push({ v1: vOffset + 4, v2: vOffset + 6, v3: vOffset + 7 });
                    
                    // Front face (y=y0)
                    triangles.push({ v1: vOffset + 0, v2: vOffset + 1, v3: vOffset + 5 });
                    triangles.push({ v1: vOffset + 0, v2: vOffset + 5, v3: vOffset + 4 });
                    
                    // Back face (y=y1)
                    triangles.push({ v1: vOffset + 2, v2: vOffset + 3, v3: vOffset + 7 });
                    triangles.push({ v1: vOffset + 2, v2: vOffset + 7, v3: vOffset + 6 });
                    
                    // Left face (x=x0)
                    triangles.push({ v1: vOffset + 0, v2: vOffset + 4, v3: vOffset + 7 });
                    triangles.push({ v1: vOffset + 0, v2: vOffset + 7, v3: vOffset + 3 });
                    
                    // Right face (x=x1)
                    triangles.push({ v1: vOffset + 1, v2: vOffset + 2, v3: vOffset + 6 });
                    triangles.push({ v1: vOffset + 1, v2: vOffset + 6, v3: vOffset + 5 });
                }
            }
        }
        
        if (vertices.length > 0) {
            xml.push(`    <object id="${objectId}" type="model">`);
            xml.push('      <mesh>');
            xml.push('        <vertices>');
            vertices.forEach(v => {
                xml.push(`          <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}" />`);
            });
            xml.push('        </vertices>');
            xml.push('        <triangles>');
            triangles.forEach(t => {
                xml.push(`          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${colorIdx}" />`);
            });
            xml.push('        </triangles>');
            xml.push('      </mesh>');
            xml.push('    </object>');
            
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    xml.push('  </resources>');
    xml.push('  <build>');
    
    // Add all objects to the build
    objectIds.forEach(id => {
        xml.push(`    <item objectid="${id}" />`);
    });
    
    xml.push('  </build>');
    xml.push('</model>');
    
    const xmlString = xml.join('\n');
    return new Blob([xmlString], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

/**
 * Generate a zip file with OpenSCAD masks format
 */
export async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    // For now, create a simple implementation that generates the files
    // In a production environment, you'd want to use a proper ZIP library
    
    const files: Array<{ name: string; content: string | Uint8Array }> = [];
    
    // Generate one PNG for each color
    image.partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (no pixel)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG data URL and extract base64
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        files.push({
            name: `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`,
            content: bytes
        });
    });
    
    // Generate OpenSCAD file
    const scadLines: string[] = [];
    scadLines.push('// Generated OpenSCAD file for pixel art display');
    scadLines.push('');
    scadLines.push('pixel_size = 2.5; // mm per pixel');
    scadLines.push(`pixel_height = ${settings.pixelHeight}; // mm height for colored pixels`);
    scadLines.push(`base_height = ${settings.baseHeight}; // mm height for base layer`);
    scadLines.push(`width = ${image.width};`);
    scadLines.push(`height = ${image.height};`);
    scadLines.push('');
    scadLines.push('module pixel_layer(image_file, color_rgb) {');
    scadLines.push('    color(color_rgb)');
    scadLines.push('    translate([0, 0, base_height])');
    scadLines.push('    scale([pixel_size, pixel_size, pixel_height])');
    scadLines.push('    surface(file=image_file, center=false, invert=true);');
    scadLines.push('}');
    scadLines.push('');
    scadLines.push('// Base layer');
    scadLines.push('color([0.5, 0.5, 0.5])');
    scadLines.push('cube([width * pixel_size, height * pixel_size, base_height]);');
    scadLines.push('');
    scadLines.push('// Color layers');
    
    image.partList.forEach((part, colorIdx) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        
        scadLines.push(`pixel_layer("${filename}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]); // ${part.target.name}`);
    });
    
    files.push({
        name: `${settings.filename}.scad`,
        content: scadLines.join('\n')
    });
    
    // Create a simple ZIP file (basic implementation)
    // For production, use a proper library like JSZip
    return createSimpleZip(files);
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Create a basic ZIP file from an array of files
 * This is a simplified implementation for demonstration
 */
function createSimpleZip(files: Array<{ name: string; content: string | Uint8Array }>): Blob {
    // For a production implementation, use a library like JSZip
    // This is a placeholder that creates a simple archive
    
    const parts: Uint8Array[] = [];
    let offset = 0;
    const centralDirectory: Uint8Array[] = [];
    
    files.forEach(file => {
        const content = typeof file.content === 'string' 
            ? new TextEncoder().encode(file.content)
            : file.content;
        const filename = new TextEncoder().encode(file.name);
        
        // Local file header
        const header = new Uint8Array(30 + filename.length);
        const view = new DataView(header.buffer);
        
        view.setUint32(0, 0x04034b50, true); // Local file header signature
        view.setUint16(4, 20, true); // Version needed
        view.setUint16(6, 0, true); // Flags
        view.setUint16(8, 0, true); // Compression method (0 = none)
        view.setUint16(10, 0, true); // File modification time
        view.setUint16(12, 0, true); // File modification date
        view.setUint32(14, 0, true); // CRC-32 (simplified, set to 0)
        view.setUint32(18, content.length, true); // Compressed size
        view.setUint32(22, content.length, true); // Uncompressed size
        view.setUint16(26, filename.length, true); // Filename length
        view.setUint16(28, 0, true); // Extra field length
        
        header.set(filename, 30);
        
        parts.push(header);
        parts.push(content);
        
        // Central directory entry
        const cdEntry = new Uint8Array(46 + filename.length);
        const cdView = new DataView(cdEntry.buffer);
        
        cdView.setUint32(0, 0x02014b50, true); // Central directory signature
        cdView.setUint16(4, 20, true); // Version made by
        cdView.setUint16(6, 20, true); // Version needed
        cdView.setUint16(8, 0, true); // Flags
        cdView.setUint16(10, 0, true); // Compression method
        cdView.setUint16(12, 0, true); // Modification time
        cdView.setUint16(14, 0, true); // Modification date
        cdView.setUint32(16, 0, true); // CRC-32
        cdView.setUint32(20, content.length, true); // Compressed size
        cdView.setUint32(24, content.length, true); // Uncompressed size
        cdView.setUint16(28, filename.length, true); // Filename length
        cdView.setUint16(30, 0, true); // Extra field length
        cdView.setUint16(32, 0, true); // File comment length
        cdView.setUint16(34, 0, true); // Disk number
        cdView.setUint16(36, 0, true); // Internal attributes
        cdView.setUint32(38, 0, true); // External attributes
        cdView.setUint32(42, offset, true); // Relative offset
        
        cdEntry.set(filename, 46);
        centralDirectory.push(cdEntry);
        
        offset += header.length + content.length;
    });
    
    // Combine central directory
    const cdSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);
    const cd = new Uint8Array(cdSize);
    let cdOffset = 0;
    centralDirectory.forEach(entry => {
        cd.set(entry, cdOffset);
        cdOffset += entry.length;
    });
    
    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
    eocdView.setUint16(4, 0, true); // Disk number
    eocdView.setUint16(6, 0, true); // Start disk
    eocdView.setUint16(8, files.length, true); // Entries on this disk
    eocdView.setUint16(10, files.length, true); // Total entries
    eocdView.setUint32(12, cdSize, true); // Central directory size
    eocdView.setUint32(16, offset, true); // Central directory offset
    eocdView.setUint16(20, 0, true); // Comment length
    
    parts.push(cd);
    parts.push(eocd);
    
    return new Blob(parts, { type: 'application/zip' });
}
