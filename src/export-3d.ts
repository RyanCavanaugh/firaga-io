import { PartListImage } from './image-utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export type Export3DFormat = '3mf' | 'openscad';

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    pixelHeight: number;
    baseHeight: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    switch (settings.format) {
        case '3mf':
            await export3MF(image, settings);
            break;
        case 'openscad':
            await exportOpenSCAD(image, settings);
            break;
        default: {
            const _exhaustive: never = settings.format;
            throw new Error(`Unknown format: ${_exhaustive}`);
        }
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const xml = generate3MF(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MF(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList } = image;
    const { pixelHeight, baseHeight } = settings;

    // Build meshes for each color
    const meshes: string[] = [];
    const objectIds: number[] = [];

    partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexCount = 0;

        // Create a heightmap for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;

                    // 8 vertices of the cube
                    const v0 = localVertexCount;
                    vertices.push(`          <vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`          <vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`          <vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`          <vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`          <vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`          <vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`          <vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`          <vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    localVertexCount += 8;

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`          <triangle v1="${v0}" v2="${v0 + 2}" v3="${v0 + 1}"/>`);
                    triangles.push(`          <triangle v1="${v0}" v2="${v0 + 3}" v3="${v0 + 2}"/>`);
                    // Top face
                    triangles.push(`          <triangle v1="${v0 + 4}" v2="${v0 + 5}" v3="${v0 + 6}"/>`);
                    triangles.push(`          <triangle v1="${v0 + 4}" v2="${v0 + 6}" v3="${v0 + 7}"/>`);
                    // Front face
                    triangles.push(`          <triangle v1="${v0}" v2="${v0 + 1}" v3="${v0 + 5}"/>`);
                    triangles.push(`          <triangle v1="${v0}" v2="${v0 + 5}" v3="${v0 + 4}"/>`);
                    // Back face
                    triangles.push(`          <triangle v1="${v0 + 2}" v2="${v0 + 3}" v3="${v0 + 7}"/>`);
                    triangles.push(`          <triangle v1="${v0 + 2}" v2="${v0 + 7}" v3="${v0 + 6}"/>`);
                    // Left face
                    triangles.push(`          <triangle v1="${v0 + 3}" v2="${v0}" v3="${v0 + 4}"/>`);
                    triangles.push(`          <triangle v1="${v0 + 3}" v2="${v0 + 4}" v3="${v0 + 7}"/>`);
                    // Right face
                    triangles.push(`          <triangle v1="${v0 + 1}" v2="${v0 + 2}" v3="${v0 + 6}"/>`);
                    triangles.push(`          <triangle v1="${v0 + 1}" v2="${v0 + 6}" v3="${v0 + 5}"/>`);
                }
            }
        }

        if (vertices.length > 0) {
            const objectId = meshes.length + 1;
            objectIds.push(objectId);
            meshes.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${meshes.join('\n')}
  </resources>
  <build>
${objectIds.map(id => `    <item objectid="${id}"/>`).join('\n')}
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const zip = new JSZip();
    const { width, height, partList } = image;
    const { pixelHeight, baseHeight } = settings;

    // Generate one mask image per color
    const imagePromises = partList.map(async (part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                const value = isThisColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`mask_${colorIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, blob);
                }
                resolve();
            });
        });
    });

    await Promise.all(imagePromises);

    // Generate OpenSCAD file
    const scadLines = [
        '// Generated heightmap display',
        `pixel_height = ${pixelHeight};`,
        `base_height = ${baseHeight};`,
        `width = ${width};`,
        `height = ${height};`,
        '',
        'module color_layer(filename, r, g, b) {',
        '    color([r/255, g/255, b/255])',
        '    surface(file=filename, center=true, invert=true);',
        '}',
        '',
    ];

    partList.forEach((part, colorIndex) => {
        const filename = `mask_${colorIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        scadLines.push(
            `translate([0, 0, base_height]) scale([1, 1, pixel_height]) `,
            `  color_layer("${filename}", ${part.target.r}, ${part.target.g}, ${part.target.b});`
        );
    });

    zip.file('display.scad', scadLines.join('\n'));

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${settings.filename}_openscad.zip`);
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
