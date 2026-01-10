import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as FileSaver from 'file-saver';

export type Export3DFormat = "3mf" | "openscad";

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    beadHeight: number;
    beadWidth: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const { width, height, pixels, partList } = image;
    const { beadHeight, beadWidth } = settings;
    
    // Generate 3MF content
    let modelContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelContent += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelContent += '  <resources>\n';
    
    // Define materials for each color
    modelContent += '    <basematerials id="1">\n';
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        modelContent += `      <base name="${color.name}" displaycolor="#${hexColor}" />\n`;
    }
    modelContent += '    </basematerials>\n';
    
    // Create a mesh for each color
    let objectId = 2;
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and create boxes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * beadWidth;
                    const y0 = y * beadWidth;
                    const x1 = (x + 1) * beadWidth;
                    const y1 = (y + 1) * beadWidth;
                    const z0 = 0;
                    const z1 = beadHeight;
                    
                    // 8 vertices of the box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
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
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            modelContent += `    <object id="${objectId}" type="model">\n`;
            modelContent += '      <mesh>\n';
            modelContent += '        <vertices>\n';
            for (const [x, y, z] of vertices) {
                modelContent += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
            }
            modelContent += '        </vertices>\n';
            modelContent += '        <triangles>\n';
            for (const [v1, v2, v3] of triangles) {
                modelContent += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />\n`;
            }
            modelContent += '        </triangles>\n';
            modelContent += '      </mesh>\n';
            modelContent += '    </object>\n';
            objectId++;
        }
    }
    
    modelContent += '  </resources>\n';
    modelContent += '  <build>\n';
    
    // Add all objects to the build
    for (let id = 2; id < objectId; id++) {
        modelContent += `    <item objectid="${id}" />\n`;
    }
    
    modelContent += '  </build>\n';
    modelContent += '</model>\n';
    
    // Create 3MF package structure (ZIP file)
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add required files
    zip.file('[Content_Types].xml', 
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n' +
        '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n' +
        '</Types>');
    
    const relsFolder = zip.folder('_rels');
    relsFolder!.file('.rels',
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n' +
        '</Relationships>');
    
    const modelFolder = zip.folder('3D');
    modelFolder!.file('3dmodel.model', modelContent);
    
    // Generate and save the file
    const blob = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const { width, height, pixels, partList } = image;
    const { beadHeight, beadWidth } = settings;
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Create a black and white image for each color
    const imagePromises: Array<Promise<Blob>> = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
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
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob
        const colorName = partList[colorIdx].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const promise = new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/png');
        });
        
        imagePromises.push(promise);
        
        promise.then(blob => {
            zip.file(`mask_${colorIdx}_${colorName}.png`, blob);
        });
    }
    
    // Wait for all images to be created
    await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    let scadContent = '// Generated by firaga.io\n';
    scadContent += '// 3D model from bead pattern\n\n';
    scadContent += `bead_width = ${beadWidth};\n`;
    scadContent += `bead_height = ${beadHeight};\n`;
    scadContent += `image_width = ${width};\n`;
    scadContent += `image_height = ${height};\n\n`;
    
    scadContent += 'union() {\n';
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx].target;
        const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hexColor = colorEntryToHex(color);
        
        scadContent += `  // ${color.name}\n`;
        scadContent += `  color("${hexColor}")\n`;
        scadContent += `  scale([bead_width, bead_width, bead_height])\n`;
        scadContent += `  surface(file = "mask_${colorIdx}_${colorName}.png", center = false, invert = true);\n\n`;
    }
    
    scadContent += '}\n';
    
    zip.file('model.scad', scadContent);
    
    // Generate README
    const readme = `3D Model Export from firaga.io
    
This archive contains:
- model.scad: OpenSCAD file to generate the 3D model
- mask_*.png: Height map images for each color

To use:
1. Install OpenSCAD from https://openscad.org/
2. Open model.scad in OpenSCAD
3. Render the model (F6)
4. Export to STL or other 3D format

The model uses surface() with heightmaps to create a 3D representation
of your bead pattern, with each color as a separate layer.
`;
    
    zip.file('README.txt', readme);
    
    // Generate and save the file
    const blob = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(blob, `${settings.filename}_openscad.zip`);
}
