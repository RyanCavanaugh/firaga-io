import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number; // Height in mm per pixel layer
    pixelSize: number;   // Width/depth in mm per pixel
}

/**
 * Export the image as a 3D file format
 */
export async function export3D(image: PartListImage, settings: ThreeDSettings, filename: string) {
    if (settings.format === "3mf") {
        export3MF(image, settings, filename);
    } else if (settings.format === "openscad") {
        exportOpenSCAD(image, settings, filename);
    }
}

/**
 * Export as 3MF triangle mesh with separate material shapes for each color
 */
function export3MF(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, pixelSize } = settings;
    
    // Build 3MF XML content
    let meshId = 1;
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color
    partList.forEach((part, idx) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove # prefix
        materials.push(`    <basematerials:base name="${color.name}" displaycolor="#${hexColor}" />`);
    });
    
    // Create mesh objects for each color
    partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate mesh for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexCount;
                    vertices.push(
                        `      <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    triangles.push(
                        // Bottom face
                        `      <triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}" />`,
                        `      <triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}" />`,
                        // Top face
                        `      <triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}" />`,
                        `      <triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}" />`,
                        // Front face
                        `      <triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}" />`,
                        `      <triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}" />`,
                        // Back face
                        `      <triangle v1="${baseIdx+2}" v2="${baseIdx+3}" v3="${baseIdx+7}" />`,
                        `      <triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+6}" />`,
                        // Left face
                        `      <triangle v1="${baseIdx+3}" v2="${baseIdx+0}" v3="${baseIdx+4}" />`,
                        `      <triangle v1="${baseIdx+3}" v2="${baseIdx+4}" v3="${baseIdx+7}" />`,
                        // Right face
                        `      <triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}" />`,
                        `      <triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}" />`
                    );
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshXml = `  <object id="${meshId}" type="model" name="${part.target.name}">
    <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
    </mesh>
  </object>`;
            objects.push(meshXml);
            meshId++;
        }
    });
    
    // Build complete 3MF XML
    const xml3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
  <basematerials:basematerials id="1">
${materials.join('\n')}
  </basematerials:basematerials>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;
    
    // Create the 3MF package (which is a ZIP file)
    create3MFPackage(xml3mf, filename);
}

/**
 * Create a 3MF package (ZIP file with specific structure)
 */
async function create3MFPackage(modelXml: string, filename: string) {
    // Use JSZip for creating the ZIP file
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // 3MF requires specific structure
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
    
    // Generate and download the ZIP file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, filename.replace(/\.(png|jpg|jpeg)$/i, "") + ".3mf");
}

/**
 * Export as OpenSCAD masks (ZIP with images + .scad file)
 */
async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const { pixelHeight } = settings;
    
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Create one monochrome image per color
    const imagePromises = partList.map(async (part, partIdx) => {
        // Create canvas for this color's mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG blob
        return new Promise<{ name: string, blob: Blob, color: string }>((resolve) => {
            canvas.toBlob((blob) => {
                const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                const hexColor = colorEntryToHex(part.target);
                resolve({ 
                    name: `mask_${partIdx}_${colorName}.png`, 
                    blob: blob!,
                    color: hexColor
                });
            }, 'image/png');
        });
    });
    
    const imageMasks = await Promise.all(imagePromises);
    
    // Add all mask images to ZIP
    imageMasks.forEach(mask => {
        zip.file(mask.name, mask.blob);
    });
    
    // Create OpenSCAD file that combines all masks
    const scadLines: string[] = [];
    scadLines.push('// Generated by firaga.io');
    scadLines.push('// 3D representation of pixel art');
    scadLines.push('');
    scadLines.push(`image_width = ${width};`);
    scadLines.push(`image_height = ${height};`);
    scadLines.push(`pixel_height = ${pixelHeight};`);
    scadLines.push('');
    scadLines.push('module pixel_layer(image_file, color) {');
    scadLines.push('  color(color)');
    scadLines.push('  linear_extrude(height=pixel_height)');
    scadLines.push('  scale([1, 1, 1])');
    scadLines.push('  surface(file=image_file, center=true, invert=true);');
    scadLines.push('}');
    scadLines.push('');
    scadLines.push('union() {');
    
    imageMasks.forEach((mask, idx) => {
        // Convert hex color to RGB values (0-1 range)
        const hex = mask.color.substring(1);
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        scadLines.push(`  pixel_layer("${mask.name}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);`);
    });
    
    scadLines.push('}');
    scadLines.push('');
    
    zip.file('model.scad', scadLines.join('\n'));
    
    // Generate and download the ZIP file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, filename.replace(/\.(png|jpg|jpeg)$/i, "") + "_openscad.zip");
}

/**
 * Load JSZip library dynamically
 */
async function loadJSZip(): Promise<any> {
    return new Promise((resolve) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve((window as any).JSZip);
        }
    });
}

/**
 * Helper to trigger download of a blob
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
