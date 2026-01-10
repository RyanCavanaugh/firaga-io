import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export type Export3DFormat = '3mf' | 'openscad';

export interface Export3DSettings {
    format: Export3DFormat;
    pixelHeight: number;
    baseHeight: number;
}

export function export3D(image: PartListImage, settings: Export3DSettings, filename: string) {
    if (settings.format === '3mf') {
        export3MF(image, settings, filename);
    } else if (settings.format === 'openscad') {
        exportOpenSCAD(image, settings, filename);
    }
}

function export3MF(image: PartListImage, settings: Export3DSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Build 3MF XML structure
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXml += '  <resources>\n';
    
    let objectId = 1;
    const objectIds: number[] = [];
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseVertexCount = vertices.length;
                    
                    // Add 8 vertices for the box (bottom 4, top 4)
                    // Bottom vertices
                    vertices.push([x, y, 0]);
                    vertices.push([x + 1, y, 0]);
                    vertices.push([x + 1, y + 1, 0]);
                    vertices.push([x, y + 1, 0]);
                    
                    // Top vertices
                    vertices.push([x, y, pixelHeight]);
                    vertices.push([x + 1, y, pixelHeight]);
                    vertices.push([x + 1, y + 1, pixelHeight]);
                    vertices.push([x, y + 1, pixelHeight]);
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    const v = baseVertexCount;
                    
                    // Bottom face (facing down, vertices in CW order when viewed from below)
                    triangles.push([v + 0, v + 2, v + 1]);
                    triangles.push([v + 0, v + 3, v + 2]);
                    
                    // Top face (facing up, vertices in CCW order when viewed from above)
                    triangles.push([v + 4, v + 5, v + 6]);
                    triangles.push([v + 4, v + 6, v + 7]);
                    
                    // Front face (y = 0)
                    triangles.push([v + 0, v + 1, v + 5]);
                    triangles.push([v + 0, v + 5, v + 4]);
                    
                    // Right face (x = 1)
                    triangles.push([v + 1, v + 2, v + 6]);
                    triangles.push([v + 1, v + 6, v + 5]);
                    
                    // Back face (y = 1)
                    triangles.push([v + 2, v + 3, v + 7]);
                    triangles.push([v + 2, v + 7, v + 6]);
                    
                    // Left face (x = 0)
                    triangles.push([v + 3, v + 0, v + 4]);
                    triangles.push([v + 3, v + 4, v + 7]);
                }
            }
        }
        
        if (vertices.length === 0) continue;
        
        // Add mesh object for this color
        modelXml += `    <object id="${objectId}" type="model">\n`;
        modelXml += '      <mesh>\n';
        modelXml += '        <vertices>\n';
        
        for (const [x, y, z] of vertices) {
            modelXml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
        }
        
        modelXml += '        </vertices>\n';
        modelXml += '        <triangles>\n';
        
        for (const [v1, v2, v3] of triangles) {
            modelXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        }
        
        modelXml += '        </triangles>\n';
        modelXml += '      </mesh>\n';
        modelXml += '    </object>\n';
        
        objectIds.push(objectId);
        objectId++;
    }
    
    // Create a build item that combines all objects
    modelXml += `    <object id="${objectId}" type="model">\n`;
    modelXml += '      <components>\n';
    for (const id of objectIds) {
        modelXml += `        <component objectid="${id}" />\n`;
    }
    modelXml += '      </components>\n';
    modelXml += '    </object>\n';
    
    modelXml += '  </resources>\n';
    modelXml += '  <build>\n';
    modelXml += `    <item objectid="${objectId}" />\n`;
    modelXml += '  </build>\n';
    modelXml += '</model>';
    
    // Create the 3MF package (ZIP file)
    // For simplicity, we'll create a basic structure
    // In a real implementation, you'd use a proper ZIP library
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf.xml`);
}

function exportOpenSCAD(image: PartListImage, settings: Export3DSettings, filename: string) {
    const { width, height, partList, pixels } = image;
    const { pixelHeight } = settings;
    
    // Create mask images for each color
    const masks: { [key: number]: ImageData } = {};
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (pixels[y][x] === colorIdx) {
                    // White pixel
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                } else {
                    // Black pixel
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        masks[colorIdx] = imageData;
    }
    
    // Generate OpenSCAD file
    let scadContent = '// Generated by firaga.io\n\n';
    scadContent += `width = ${width};\n`;
    scadContent += `height = ${height};\n`;
    scadContent += `pixelHeight = ${pixelHeight};\n\n`;
    
    scadContent += 'module colorLayer(imageFile, layerHeight) {\n';
    scadContent += '  surface(file = imageFile, center = true, invert = true);\n';
    scadContent += '}\n\n';
    
    scadContent += 'union() {\n';
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        scadContent += `  // ${color.target.name}\n`;
        scadContent += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `    colorLayer("mask_${colorIdx}.png", ${pixelHeight});\n`;
    }
    
    scadContent += '}\n';
    
    // Create a downloadable package
    // In a browser environment, we'll need to create individual files
    // For now, let's create the SCAD file and provide instructions
    const blob = new Blob([scadContent], { type: 'text/plain' });
    saveAs(blob, `${filename}.scad`);
    
    // Download mask images
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(masks[colorIdx], 0, 0);
        
        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${filename}_mask_${colorIdx}.png`);
            }
        });
    }
    
    // Note: A proper implementation would create a ZIP file
    alert(`OpenSCAD files will be downloaded separately:\n- ${filename}.scad\n- ${partList.length} mask PNG files\n\nPlace all files in the same directory to use with OpenSCAD.`);
}
