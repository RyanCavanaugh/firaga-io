import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    height: number; // Height of each pixel in mm
    baseThickness: number; // Thickness of base in mm
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === '3mf') {
        generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const pixelSize = 1.0; // 1mm per pixel
    const baseThickness = settings.baseThickness;
    const pixelHeight = settings.height;

    // Build 3MF XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';

    // Define materials (one per color)
    partList.forEach((entry, idx) => {
        const r = entry.target.r;
        const g = entry.target.g;
        const b = entry.target.b;
        xml += `    <basematerials id="${idx + 1}">\n`;
        xml += `      <base name="${escapeXml(entry.target.name)}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />\n`;
        xml += `    </basematerials>\n`;
    });

    let vertexIndex = 0;
    let objectId = 1000;

    // Create one mesh object per color
    partList.forEach((entry, colorIdx) => {
        const materialId = colorIdx + 1;
        xml += `    <object id="${objectId}" type="model">\n`;
        xml += `      <mesh>\n`;
        xml += `        <vertices>\n`;

        const colorPixels: Array<{x: number, y: number}> = [];
        
        // Find all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    colorPixels.push({x, y});
                }
            }
        }

        const vertices: string[] = [];
        const triangles: string[] = [];
        let vIdx = 0;

        // For each pixel of this color, create a box (cube)
        colorPixels.forEach(({x, y}) => {
            const x0 = x * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y0 = y * pixelSize;
            const y1 = (y + 1) * pixelSize;
            const z0 = baseThickness;
            const z1 = baseThickness + pixelHeight;

            // 8 vertices of the box
            const baseVIdx = vIdx;
            vertices.push(
                `          <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                `          <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                `          <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                `          <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                `          <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                `          <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                `          <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                `          <vertex x="${x0}" y="${y1}" z="${z1}" />`
            );

            // 12 triangles (2 per face, 6 faces)
            // Bottom face (z0)
            triangles.push(`          <triangle v1="${baseVIdx}" v2="${baseVIdx+2}" v3="${baseVIdx+1}" />`);
            triangles.push(`          <triangle v1="${baseVIdx}" v2="${baseVIdx+3}" v3="${baseVIdx+2}" />`);
            // Top face (z1)
            triangles.push(`          <triangle v1="${baseVIdx+4}" v2="${baseVIdx+5}" v3="${baseVIdx+6}" />`);
            triangles.push(`          <triangle v1="${baseVIdx+4}" v2="${baseVIdx+6}" v3="${baseVIdx+7}" />`);
            // Front face (y0)
            triangles.push(`          <triangle v1="${baseVIdx}" v2="${baseVIdx+1}" v3="${baseVIdx+5}" />`);
            triangles.push(`          <triangle v1="${baseVIdx}" v2="${baseVIdx+5}" v3="${baseVIdx+4}" />`);
            // Back face (y1)
            triangles.push(`          <triangle v1="${baseVIdx+3}" v2="${baseVIdx+6}" v3="${baseVIdx+2}" />`);
            triangles.push(`          <triangle v1="${baseVIdx+3}" v2="${baseVIdx+7}" v3="${baseVIdx+6}" />`);
            // Left face (x0)
            triangles.push(`          <triangle v1="${baseVIdx}" v2="${baseVIdx+4}" v3="${baseVIdx+7}" />`);
            triangles.push(`          <triangle v1="${baseVIdx}" v2="${baseVIdx+7}" v3="${baseVIdx+3}" />`);
            // Right face (x1)
            triangles.push(`          <triangle v1="${baseVIdx+1}" v2="${baseVIdx+2}" v3="${baseVIdx+6}" />`);
            triangles.push(`          <triangle v1="${baseVIdx+1}" v2="${baseVIdx+6}" v3="${baseVIdx+5}" />`);

            vIdx += 8;
        });

        xml += vertices.join('\n') + '\n';
        xml += `        </vertices>\n`;
        xml += `        <triangles>\n`;
        xml += triangles.join('\n') + '\n';
        xml += `        </triangles>\n`;
        xml += `      </mesh>\n`;
        xml += `    </object>\n`;

        objectId++;
    });

    // Build section
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add each color object to the build with its material
    partList.forEach((entry, colorIdx) => {
        const objId = 1000 + colorIdx;
        const matId = colorIdx + 1;
        xml += `    <item objectid="${objId}" materialid="${matId}" />\n`;
    });
    
    xml += '  </build>\n';
    xml += '</model>\n';

    // Save as 3MF file (which is actually a zip containing the xml)
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, 'model.3mf');
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    const pixelHeight = settings.height;

    // Create a binary mask for each color
    const blobPromises = partList.map(async (entry, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (transparent/absent)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color exists
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        return new Promise<{filename: string, blob: Blob}>((resolve) => {
            canvas.toBlob((blob) => {
                const filename = `color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
                resolve({ filename, blob: blob! });
            });
        });
    });

    // Wait for all blobs to be created
    const blobResults = await Promise.all(blobPromises);
    
    // Add all blobs to the zip
    blobResults.forEach(({filename, blob}) => {
        zip.file(filename, blob);
    });

    // Create the OpenSCAD file
    let scadContent = '// Generated 3D model from Firaga\n';
    scadContent += '// Each color is represented as a heightmap\n\n';
    scadContent += `pixel_size = 1; // mm\n`;
    scadContent += `pixel_height = ${pixelHeight}; // mm\n`;
    scadContent += `base_thickness = ${settings.baseThickness}; // mm\n\n`;

    partList.forEach((entry, colorIdx) => {
        const filename = `color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        const r = entry.target.r / 255;
        const g = entry.target.g / 255;
        const b = entry.target.b / 255;
        
        scadContent += `// ${entry.target.name}\n`;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `translate([0, 0, base_thickness])\n`;
        scadContent += `scale([pixel_size, pixel_size, pixel_height])\n`;
        scadContent += `surface(file = "${filename}", center = false, invert = true);\n\n`;
    });

    zip.file('model.scad', scadContent);

    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'openscad_model.zip');
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
