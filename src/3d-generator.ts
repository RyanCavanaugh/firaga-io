import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    height: number; // Height in mm
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, settings: ThreeDSettings): Blob {
    const pixelSize = 2.5; // mm per pixel
    const height = settings.height;

    // Build 3MF XML structure
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
`;

    // Define materials (colors)
    modelXml += `    <m:colorgroup id="1">\n`;
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        modelXml += `      <m:color color="#${hex}FF" />\n`;
    }
    modelXml += `    </m:colorgroup>\n`;

    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;

                    // 8 vertices of the box
                    const v0 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    const v1 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    const v2 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    const v3 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    const v4 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    const v5 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    const v6 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    const v7 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                    // Top
                    triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                    // Front
                    triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                    // Back
                    triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                    // Left
                    triangles.push(`      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`);
                    // Right
                    triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
                }
            }
        }

        if (vertices.length > 0) {
            modelXml += `    <object id="${objectId}" type="model">\n`;
            modelXml += `      <mesh>\n`;
            modelXml += `        <vertices>\n`;
            modelXml += vertices.join('\n') + '\n';
            modelXml += `        </vertices>\n`;
            modelXml += `        <triangles>\n`;
            modelXml += triangles.join('\n') + '\n';
            modelXml += `        </triangles>\n`;
            modelXml += `      </mesh>\n`;
            modelXml += `    </object>\n`;
            objectIds.push(objectId);
            objectId++;
        }
    }

    modelXml += `  </resources>\n`;
    modelXml += `  <build>\n`;
    
    // Add all objects to the build with their materials
    let colorIdx = 0;
    for (let i = 0; i < objectIds.length; i++) {
        // Find the corresponding color index
        while (colorIdx < image.partList.length) {
            let hasPixels = false;
            for (let y = 0; y < image.height && !hasPixels; y++) {
                for (let x = 0; x < image.width && !hasPixels; x++) {
                    if (image.pixels[y][x] === colorIdx) {
                        hasPixels = true;
                    }
                }
            }
            if (hasPixels) break;
            colorIdx++;
        }
        modelXml += `    <item objectid="${objectIds[i]}" p:UUID="${generateUUID()}" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">\n`;
        modelXml += `      <m:color colorid="${colorIdx}" />\n`;
        modelXml += `    </item>\n`;
        colorIdx++;
    }
    
    modelXml += `  </build>\n`;
    modelXml += `</model>\n`;

    return new Blob([modelXml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
}

/**
 * Generate OpenSCAD masks format (zip with images and .scad file)
 */
export async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    const zip = new JSZip();
    const pixelSize = 2.5; // mm per pixel
    const height = settings.height;

    // Create one image per color
    const imagePromises: Promise<void>[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const colorName = image.partList[colorIndex].target.name.replace(/[^a-zA-Z0-9]/g, '_');
                    zip.file(`mask_${colorIndex}_${colorName}.png`, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    }
    
    await Promise.all(imagePromises);
    
    // Create OpenSCAD file
    let scadContent = `// Auto-generated OpenSCAD file for pixel art
// Image dimensions: ${image.width}x${image.height}
// Pixel size: ${pixelSize}mm
// Height: ${height}mm

pixel_size = ${pixelSize};
block_height = ${height};

`;

    // Generate modules for each color layer
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex].target;
        const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadContent += `// Layer for ${color.name}\n`;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `union() {\n`;
        
        // Add cubes for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    scadContent += `  translate([${x * pixelSize}, ${y * pixelSize}, 0]) cube([pixel_size, pixel_size, block_height]);\n`;
                }
            }
        }
        
        scadContent += `}\n\n`;
    }
    
    zip.file('model.scad', scadContent);
    
    return await zip.generateAsync({ type: 'blob' });
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
