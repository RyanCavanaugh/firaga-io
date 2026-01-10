import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
    pitch: number;
    height: number;
}

/**
 * Generate 3D output in the specified format
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    switch (settings.format) {
        case "3mf":
            generate3MF(image, settings);
            break;
        case "openscad":
            generateOpenSCAD(image, settings);
            break;
        default:
            settings.format satisfies never;
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const xml: string[] = [];
    
    xml.push('<?xml version="1.0" encoding="UTF-8"?>');
    xml.push('<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">');
    xml.push('  <resources>');
    
    // Define materials for each color
    xml.push('    <basematerials id="1">');
    image.partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        xml.push(`      <base name="${escapeXml(entry.target.name)}" displaycolor="#${hex.slice(1)}" />`);
    });
    xml.push('    </basematerials>');
    
    // Create separate mesh for each color
    let objectId = 2;
    image.partList.forEach((entry, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const vBase = vertices.length;
                    const x0 = x * settings.pitch;
                    const x1 = (x + 1) * settings.pitch;
                    const y0 = y * settings.pitch;
                    const y1 = (y + 1) * settings.pitch;
                    const z0 = 0;
                    const z1 = settings.height;
                    
                    // Add 8 vertices for the cube
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([vBase + 0, vBase + 2, vBase + 1], [vBase + 0, vBase + 3, vBase + 2]);
                    // Top
                    triangles.push([vBase + 4, vBase + 5, vBase + 6], [vBase + 4, vBase + 6, vBase + 7]);
                    // Front
                    triangles.push([vBase + 0, vBase + 1, vBase + 5], [vBase + 0, vBase + 5, vBase + 4]);
                    // Back
                    triangles.push([vBase + 2, vBase + 3, vBase + 7], [vBase + 2, vBase + 7, vBase + 6]);
                    // Left
                    triangles.push([vBase + 3, vBase + 0, vBase + 4], [vBase + 3, vBase + 4, vBase + 7]);
                    // Right
                    triangles.push([vBase + 1, vBase + 2, vBase + 6], [vBase + 1, vBase + 6, vBase + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml.push(`    <object id="${objectId}" type="model">`);
            xml.push('      <mesh>');
            xml.push('        <vertices>');
            vertices.forEach(v => {
                xml.push(`          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />`);
            });
            xml.push('        </vertices>');
            xml.push('        <triangles>');
            triangles.forEach(t => {
                xml.push(`          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />`);
            });
            xml.push('        </triangles>');
            xml.push('      </mesh>');
            xml.push('    </object>');
            objectId++;
        }
    });
    
    xml.push('  </resources>');
    xml.push('  <build>');
    
    // Add all objects to the build
    for (let id = 2; id < objectId; id++) {
        xml.push(`    <item objectid="${id}" />`);
    }
    
    xml.push('  </build>');
    xml.push('</model>');
    
    const xmlContent = xml.join('\n');
    downloadFile(`${settings.filename}.3mf`, xmlContent, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

/**
 * Generate OpenSCAD masks format (zip with monochrome images + .scad file)
 */
async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Generate one black/white PNG per color
    const imagePromises: Array<Promise<void>> = [];
    
    image.partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const colorName = sanitizeFilename(entry.target.name);
        const filename = `color_${colorIdx}_${colorName}.png`;
        
        imagePromises.push(
            new Promise<void>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        zip.file(filename, blob);
                    }
                    resolve();
                }, 'image/png')
            })
        );
    });
    
    await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    const scadLines: string[] = [];
    scadLines.push('// Generated by firaga.io');
    scadLines.push(`// Image: ${settings.filename}`);
    scadLines.push('');
    scadLines.push(`pitch = ${settings.pitch};`);
    scadLines.push(`height = ${settings.height};`);
    scadLines.push(`img_width = ${image.width};`);
    scadLines.push(`img_height = ${image.height};`);
    scadLines.push('');
    scadLines.push('// Combine all color layers');
    scadLines.push('union() {');
    
    image.partList.forEach((entry, colorIdx) => {
        const colorName = sanitizeFilename(entry.target.name);
        const filename = `color_${colorIdx}_${colorName}.png`;
        const hex = colorEntryToHex(entry.target);
        
        scadLines.push(`  // Color: ${entry.target.name} (${hex})`);
        scadLines.push(`  color("${hex}")`);
        scadLines.push(`  translate([0, 0, ${colorIdx * settings.height}])`);
        scadLines.push(`  scale([pitch, pitch, height])`);
        scadLines.push(`    surface(file = "${filename}", center = true, invert = true);`);
        scadLines.push('');
    });
    
    scadLines.push('}');
    
    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));
    
    // Generate and download the zip
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(`${settings.filename}_openscad.zip`, blob);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<any> {
    const tagName = 'jszip-script-tag';
    const existing = document.getElementById(tagName);
    
    if (existing && (window as any).JSZip) {
        return (window as any).JSZip;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = tagName;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = () => {
            reject(new Error('Failed to load JSZip'));
        };
        document.head.appendChild(script);
    });
}
