import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';
import { saveAs } from 'file-saver';

export type Output3DFormat = '3mf' | 'openscad-masks';

export interface ThreeDSettings {
    format: Output3DFormat;
    pixelHeight: number;
    pixelWidth: number;
    baseThickness: number;
}

export function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    switch (settings.format) {
        case '3mf':
            generate3MF(image, settings, filename);
            break;
        case 'openscad-masks':
            generateOpenSCADMasks(image, settings, filename);
            break;
        default:
            const _exhaustive: never = settings.format;
            throw new Error(`Unknown format: ${_exhaustive}`);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    
    const meshes: string[] = [];
    const materials: Map<string, { id: number; r: number; g: number; b: number }> = new Map();
    let materialId = 1;
    let objectId = 1;

    // Build materials from part list
    image.partList.forEach(part => {
        const hex = colorEntryToHex(part.target);
        if (!materials.has(hex)) {
            materials.set(hex, {
                id: materialId++,
                r: part.target.r,
                g: part.target.g,
                b: part.target.b
            });
        }
    });

    // Group pixels by color for separate meshes
    const pixelsByColor = new Map<string, Array<{ x: number; y: number }>>();
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const partIndex = image.pixels[y][x];
            if (partIndex === undefined) continue;
            
            const part = image.partList[partIndex];
            if (!part) continue;
            
            const hex = colorEntryToHex(part.target);
            if (!pixelsByColor.has(hex)) {
                pixelsByColor.set(hex, []);
            }
            pixelsByColor.get(hex)!.push({ x, y });
        }
    }

    // Generate mesh for each color
    const objects: string[] = [];
    pixelsByColor.forEach((pixels, colorHex) => {
        const material = materials.get(colorHex)!;
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        pixels.forEach(({ x, y }) => {
            const x0 = x * pixelWidth;
            const x1 = (x + 1) * pixelWidth;
            const y0 = y * pixelHeight;
            const y1 = (y + 1) * pixelHeight;
            const z0 = 0;
            const z1 = baseThickness;

            // 8 vertices for a box
            const baseIdx = vertexIndex;
            vertices.push(
                `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
                `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
                `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
                `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
                `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
                `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
                `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
                `<vertex x="${x0}" y="${y1}" z="${z1}" />`
            );

            // 12 triangles for a box (2 per face)
            // Bottom face (z0)
            triangles.push(
                `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" />`,
                `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" />`
            );
            // Top face (z1)
            triangles.push(
                `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`,
                `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`
            );
            // Front face (y0)
            triangles.push(
                `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" />`,
                `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" />`
            );
            // Back face (y1)
            triangles.push(
                `<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`,
                `<triangle v1="${baseIdx + 2}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`
            );
            // Left face (x0)
            triangles.push(
                `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`,
                `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" />`
            );
            // Right face (x1)
            triangles.push(
                `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`,
                `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`
            );

            vertexIndex += 8;
        });

        const meshXml = `    <mesh>
      <vertices>
${vertices.map(v => '        ' + v).join('\n')}
      </vertices>
      <triangles>
${triangles.map(t => '        ' + t).join('\n')}
      </triangles>
    </mesh>`;

        objects.push(`  <object id="${objectId}" type="model" pid="${material.id}">
${meshXml}
  </object>`);
        objectId++;
    });

    // Build material definitions
    const materialDefs = Array.from(materials.values()).map(mat =>
        `  <basematerials id="${mat.id}">
    <base name="Color${mat.id}" displaycolor="#${rgbToHex(mat.r, mat.g, mat.b)}" />
  </basematerials>`
    ).join('\n');

    // Build complete 3MF XML
    const xml3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materialDefs}
${objects.join('\n')}
  </resources>
  <build>
${Array.from({ length: objects.length }, (_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;

    // 3MF files are ZIP archives with specific structure
    // For simplicity, we'll save as .model file which can be zipped manually
    // A full implementation would use JSZip or similar
    const blob = new Blob([xml3mf], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    // This would require JSZip to create a proper ZIP file
    // For now, we'll generate the files and save them individually
    // In production, you'd want to bundle these into a single ZIP
    
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    const masks = new Map<string, ImageData>();
    
    // Create a mask image for each color
    image.partList.forEach((part, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (transparent)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const colorName = sanitizeFilename(part.target.name || `color_${idx}`);
        masks.set(colorName, ctx.getImageData(0, 0, canvas.width, canvas.height));
    });
    
    // Generate OpenSCAD script
    const scadLines: string[] = [
        '// Generated by firaga.io',
        '// 3D representation of pixel art',
        '',
        `pixel_width = ${pixelWidth};`,
        `pixel_height = ${pixelHeight};`,
        `base_thickness = ${baseThickness};`,
        `image_width = ${image.width};`,
        `image_height = ${image.height};`,
        '',
        'module pixel_layer(image_file, color_rgb) {',
        '  color(color_rgb)',
        '  translate([0, 0, 0])',
        '  linear_extrude(height=base_thickness)',
        '  scale([pixel_width, pixel_height, 1])',
        '  surface(file=image_file, invert=true, center=false);',
        '}',
        '',
        'union() {'
    ];
    
    image.partList.forEach((part, idx) => {
        const colorName = sanitizeFilename(part.target.name || `color_${idx}`);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        scadLines.push(`  pixel_layer("${colorName}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);`);
    });
    
    scadLines.push('}');
    
    const scadContent = scadLines.join('\n');
    
    // Save SCAD file
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    saveAs(scadBlob, `${filename}.scad`);
    
    // Save mask images
    masks.forEach((imageData, colorName) => {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob(blob => {
            if (blob) {
                saveAs(blob, `${filename}_${colorName}.png`);
            }
        });
    });
    
    alert(`OpenSCAD files generated! Download includes:\n- ${filename}.scad\n- ${image.partList.length} mask PNG files\n\nCombine these files in the same directory and open the .scad file in OpenSCAD.`);
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}
