import JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DFormat = '3mf' | 'openscad';

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    pixelWidth: number;  // Width of each pixel in mm
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else if (settings.format === 'openscad') {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const { width, height, partList, pixels } = image;
    
    // Build 3MF file structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `
      <base name="${part.target.name}" displaycolor="${hex}" />`;
    });
    
    xml += `
    </basematerials>`;
    
    // Generate meshes for each color
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build vertices and triangles for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * settings.pixelWidth;
                    const x1 = (x + 1) * settings.pixelWidth;
                    const y0 = y * settings.pixelWidth;
                    const y1 = (y + 1) * settings.pixelWidth;
                    const z0 = 0;
                    const z1 = settings.pixelHeight;
                    
                    // 8 vertices for a cube
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    const tris: Array<[number, number, number]> = [
                        // bottom
                        [0, 1, 2], [0, 2, 3],
                        // top
                        [4, 6, 5], [4, 7, 6],
                        // front
                        [0, 5, 1], [0, 4, 5],
                        // back
                        [2, 7, 3], [2, 6, 7],
                        // left
                        [0, 3, 7], [0, 7, 4],
                        // right
                        [1, 6, 2], [1, 5, 6]
                    ];
                    
                    tris.forEach(([a, b, c]) => {
                        triangles.push([baseIdx + a, baseIdx + b, baseIdx + c]);
                    });
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `
    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>`;
            vertices.forEach(([x, y, z]) => {
                xml += `
          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />`;
            });
            xml += `
        </vertices>
        <triangles>`;
            triangles.forEach(([v1, v2, v3]) => {
                xml += `
          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />`;
            });
            xml += `
        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `
  </resources>
  <build>`;
    
    // Add all objects to build
    partList.forEach((part, colorIdx) => {
        xml += `
    <item objectid="${colorIdx + 2}" />`;
    });
    
    xml += `
  </build>
</model>`;
    
    // Create zip file
    const zip = new JSZip();
    zip.file('3D/3dmodel.model', xml);
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const { width, height, partList, pixels } = image;
    const zip = new JSZip();
    
    // Create a PNG for each color
    const canvasPromises = partList.map((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);
        
        // Set pixels: white where color matches, black otherwise
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isMatch = pixels[y][x] === colorIdx;
                const value = isMatch ? 255 : 0;
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return new Promise<{ name: string, blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({ name: `${safeName}_${colorIdx}.png`, blob: blob! });
            });
        });
    });
    
    const imageFiles = await Promise.all(canvasPromises);
    imageFiles.forEach(({ name, blob }) => {
        zip.file(name, blob);
    });
    
    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel dimensions: ${width} x ${height}
// Physical size: ${(width * settings.pixelWidth).toFixed(2)}mm x ${(height * settings.pixelWidth).toFixed(2)}mm

pixel_width = ${settings.pixelWidth};
pixel_height = ${settings.pixelHeight};
image_width = ${width};
image_height = ${height};

module pixel_layer(image_file, color) {
    color(color)
    scale([pixel_width, pixel_width, pixel_height])
    surface(file = image_file, center = true, invert = true);
}

`;
    
    // Add each color layer
    partList.forEach((part, colorIdx) => {
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hex = colorEntryToHex(part.target);
        // Convert hex to RGB values (0-1 range)
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadContent += `pixel_layer("${safeName}_${colorIdx}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]); // ${part.target.name}\n`;
    });
    
    zip.file('model.scad', scadContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

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
