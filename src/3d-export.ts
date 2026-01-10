import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDExportSettings = {
    format: '3mf' | 'openscad-masks';
    pixelHeight: number;
    pixelWidth: number;
    baseThickness: number;
    filename: string;
};

export async function export3D(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, baseThickness } = settings;

    // Build 3MF XML structure
    const resources: string[] = [];
    const objects: string[] = [];
    let resourceId = 1;

    // Create material resources for each color
    const colorMaterials = new Map<number, number>();
    partList.forEach((part, idx) => {
        const colorHex = colorEntryToHex(part.target);
        const rgb = hexToRgb(colorHex);
        const materialId = resourceId++;
        colorMaterials.set(idx, materialId);
        resources.push(
            `    <basematerials id="${materialId}">`,
            `      <base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />`,
            `    </basematerials>`
        );
    });

    // Create mesh objects for each color
    partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a rectangular prism for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = baseThickness;

                    // 8 vertices of the prism
                    const v0 = vertexIndex;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    vertexIndex += 8;

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`      <triangle v1="${v0 + 0}" v2="${v0 + 2}" v3="${v0 + 1}" />`);
                    triangles.push(`      <triangle v1="${v0 + 0}" v2="${v0 + 3}" v3="${v0 + 2}" />`);
                    // Top face (z=z1)
                    triangles.push(`      <triangle v1="${v0 + 4}" v2="${v0 + 5}" v3="${v0 + 6}" />`);
                    triangles.push(`      <triangle v1="${v0 + 4}" v2="${v0 + 6}" v3="${v0 + 7}" />`);
                    // Front face (y=y0)
                    triangles.push(`      <triangle v1="${v0 + 0}" v2="${v0 + 1}" v3="${v0 + 5}" />`);
                    triangles.push(`      <triangle v1="${v0 + 0}" v2="${v0 + 5}" v3="${v0 + 4}" />`);
                    // Back face (y=y1)
                    triangles.push(`      <triangle v1="${v0 + 2}" v2="${v0 + 3}" v3="${v0 + 7}" />`);
                    triangles.push(`      <triangle v1="${v0 + 2}" v2="${v0 + 7}" v3="${v0 + 6}" />`);
                    // Left face (x=x0)
                    triangles.push(`      <triangle v1="${v0 + 0}" v2="${v0 + 4}" v3="${v0 + 7}" />`);
                    triangles.push(`      <triangle v1="${v0 + 0}" v2="${v0 + 7}" v3="${v0 + 3}" />`);
                    // Right face (x=x1)
                    triangles.push(`      <triangle v1="${v0 + 1}" v2="${v0 + 2}" v3="${v0 + 6}" />`);
                    triangles.push(`      <triangle v1="${v0 + 1}" v2="${v0 + 6}" v3="${v0 + 5}" />`);
                }
            }
        }

        // Only create mesh if there are vertices
        if (vertices.length > 0) {
            const meshId = resourceId++;
            const materialId = colorMaterials.get(colorIdx)!;
            objects.push(
                `    <object id="${meshId}" type="model">`,
                `      <mesh>`,
                `        <vertices>`,
                ...vertices,
                `        </vertices>`,
                `        <triangles>`,
                ...triangles,
                `        </triangles>`,
                `      </mesh>`,
                `    </object>`
            );
            resources.push(
                `    <object id="${meshId}" type="model" pid="${materialId}" pindex="0" />`
            );
        }
    });

    const buildItems = objects.map((_, idx) => {
        const id = colorMaterials.size + 1 + idx;
        return `    <item objectid="${id}" />`;
    }).join('\n');

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">',
        '  <resources>',
        ...resources,
        ...objects,
        '  </resources>',
        '  <build>',
        buildItems,
        '  </build>',
        '</model>'
    ].join('\n');

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCADMasks(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, baseThickness } = settings;

    // Dynamically import JSZip
    const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3/+esm' as any)).default as any;
    const zip = new JSZip();

    const scadLines: string[] = [
        '// Generated by firaga.io',
        `// Image size: ${width}x${height}`,
        `pixel_width = ${pixelWidth};`,
        `pixel_height = ${pixelHeight};`,
        `base_thickness = ${baseThickness};`,
        '',
        'module color_layer(image_file, color) {',
        '  color(color)',
        '  for (y = [0:len(image_file)-1]) {',
        '    for (x = [0:len(image_file[y])-1]) {',
        '      if (image_file[y][x] > 0.5) {',
        '        translate([x * pixel_width, y * pixel_height, 0])',
        '          cube([pixel_width, pixel_height, base_thickness]);',
        '      }',
        '    }',
        '  }',
        '}',
        ''
    ];

    // Generate mask images for each color
    const imagePromises = partList.map(async (part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        const colorHex = colorEntryToHex(part.target).substring(1); // Remove '#'
        const filename = `mask_${colorIdx}_${colorHex}.png`;
        zip.file(filename, blob);

        // Add to SCAD file
        const rgb = hexToRgbNormalized(colorEntryToHex(part.target));
        scadLines.push(
            `// ${part.target.name}`,
            `${sanitizeIdentifier(part.target.name)}_mask = surface(file = "${filename}", center = false, invert = true);`,
            `color_layer(${sanitizeIdentifier(part.target.name)}_mask, [${rgb.r}, ${rgb.g}, ${rgb.b}]);`,
            ''
        );
    });

    await Promise.all(imagePromises);

    // Add SCAD file to zip
    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#808080';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `#${result[1]}${result[2]}${result[3]}`.toUpperCase();
}

function hexToRgbNormalized(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0.5, g: 0.5, b: 0.5 };
    return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    };
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeIdentifier(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_');
}
