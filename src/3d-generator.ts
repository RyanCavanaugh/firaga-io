import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad-masks';

export type ThreeDSettings = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
};

export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === '3mf') {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const { width, height, pixels, partList } = image;
    const colorToMaterial = new Map<number, number>();
    
    // Build materials section
    let materialsXML = '';
    partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target).slice(1); // Remove #
        materialsXML += `    <basematerials id="${idx + 1}">
      <base name="${entry.target.name}" displaycolor="#${hex}" />
    </basematerials>\n`;
    });

    // Build mesh objects for each color
    let objectsXML = '';
    let buildItemsXML = '';
    
    partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Generate vertices and triangles for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseVertexIdx = vertexCount;
                    
                    // Bottom face vertices
                    vertices.push(`      <vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="0" />`);
                    
                    // Top face vertices
                    vertices.push(`      <vertex x="${x}" y="${y}" z="${settings.pixelHeight + settings.baseHeight}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="${settings.pixelHeight + settings.baseHeight}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="${settings.pixelHeight + settings.baseHeight}" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="${settings.pixelHeight + settings.baseHeight}" />`);
                    
                    // Bottom face triangles
                    triangles.push(`      <triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 1}" v3="${baseVertexIdx + 2}" />`);
                    triangles.push(`      <triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 2}" v3="${baseVertexIdx + 3}" />`);
                    
                    // Top face triangles
                    triangles.push(`      <triangle v1="${baseVertexIdx + 4}" v2="${baseVertexIdx + 6}" v3="${baseVertexIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseVertexIdx + 4}" v2="${baseVertexIdx + 7}" v3="${baseVertexIdx + 6}" />`);
                    
                    // Side faces
                    // Front
                    triangles.push(`      <triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 4}" v3="${baseVertexIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 5}" v3="${baseVertexIdx + 1}" />`);
                    // Right
                    triangles.push(`      <triangle v1="${baseVertexIdx + 1}" v2="${baseVertexIdx + 5}" v3="${baseVertexIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVertexIdx + 1}" v2="${baseVertexIdx + 6}" v3="${baseVertexIdx + 2}" />`);
                    // Back
                    triangles.push(`      <triangle v1="${baseVertexIdx + 2}" v2="${baseVertexIdx + 6}" v3="${baseVertexIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseVertexIdx + 2}" v2="${baseVertexIdx + 7}" v3="${baseVertexIdx + 3}" />`);
                    // Left
                    triangles.push(`      <triangle v1="${baseVertexIdx + 3}" v2="${baseVertexIdx + 7}" v3="${baseVertexIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseVertexIdx + 3}" v2="${baseVertexIdx + 4}" v3="${baseVertexIdx}" />`);
                    
                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objectsXML += `  <object id="${colorIdx + 1}" name="${entry.target.name}" pid="${colorIdx + 1}" pindex="0" type="model">
    <mesh>
${vertices.join('\n')}
${triangles.join('\n')}
    </mesh>
  </object>\n`;

            buildItemsXML += `    <item objectid="${colorIdx + 1}" />\n`;
        }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Application">firaga.io</metadata>
  <resources>
${materialsXML}${objectsXML}  </resources>
  <build>
${buildItemsXML}  </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, '3d-output.3mf');
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): void {
    const { width, height, pixels, partList } = image;
    const JSZip = (window as any).JSZip;
    
    if (!JSZip) {
        loadJSZipAndGenerate(image, settings);
        return;
    }

    const zip = new JSZip();
    
    // Generate mask images for each color
    const surfaceModules: string[] = [];
    
    partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
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
        
        // Convert to PNG data URL and extract base64
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1];
        
        // Add to zip as binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const filename = `mask_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        zip.file(filename, bytes);
        
        // Generate OpenSCAD module for this color
        const hex = colorEntryToHex(entry.target);
        surfaceModules.push(`
// ${entry.target.name}
color("${hex}")
  translate([0, 0, ${settings.baseHeight}])
  surface(file = "${filename}", center = true, invert = true, convexity = 10);`);
    });
    
    // Generate OpenSCAD file
    const scadContent = `// Generated by firaga.io
// Pixel height: ${settings.pixelHeight}mm
// Base height: ${settings.baseHeight}mm

$fn = 20;

scale([1, 1, ${settings.pixelHeight}]) {
${surfaceModules.join('\n')}
}

// Optional base
// color("#cccccc")
//   translate([0, 0, -${settings.baseHeight}])
//   cube([${width}, ${height}, ${settings.baseHeight}], center = true);
`;
    
    zip.file('model.scad', scadContent);
    
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, 'openscad-masks.zip');
    });
}

function loadJSZipAndGenerate(image: PartListImage, settings: ThreeDSettings): void {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => generateOpenSCADMasks(image, settings);
    document.head.appendChild(script);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
