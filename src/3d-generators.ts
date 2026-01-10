import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export type ThreeDFormat = '3mf' | 'openscad-masks';

export interface ThreeDSettings {
    format: ThreeDFormat;
    heightPerLayer: number;
    baseHeight: number;
}

export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === '3mf') {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const materials: string[] = [];
    const materialMap = new Map<number, number>();
    
    image.partList.forEach((part, idx) => {
        const colorIdx = materialMap.size;
        materialMap.set(idx, colorIdx);
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        materials.push(`    <basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />`);
    });

    const meshes: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertexCount;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.heightPerLayer;

                    vertices.push(
                        `        <vertex x="${x}" y="${y}" z="${z0}" />`,
                        `        <vertex x="${x + 1}" y="${y}" z="${z0}" />`,
                        `        <vertex x="${x + 1}" y="${y + 1}" z="${z0}" />`,
                        `        <vertex x="${x}" y="${y + 1}" z="${z0}" />`,
                        `        <vertex x="${x}" y="${y}" z="${z1}" />`,
                        `        <vertex x="${x + 1}" y="${y}" z="${z1}" />`,
                        `        <vertex x="${x + 1}" y="${y + 1}" z="${z1}" />`,
                        `        <vertex x="${x}" y="${y + 1}" z="${z1}" />`
                    );

                    triangles.push(
                        `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" pid="${materialMap.get(colorIdx)}" />`,
                        `        <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 0}" pid="${materialMap.get(colorIdx)}" />`
                    );

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            meshes.push(`  <object id="${colorIdx + 1}" name="${escapeXml(image.partList[colorIdx].target.name)}" pid="${materialMap.get(colorIdx)}" type="model">
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
    }

    const model3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">Firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${meshes.join('\n')}
  </resources>
  <build>
${meshes.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;

    const blob = new Blob([model3mf], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, 'pixel-art.3mf');
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    const scadLines: string[] = [];

    scadLines.push('// Generated by Firaga.io');
    scadLines.push('// Pixel art 3D model using heightmaps');
    scadLines.push('');
    scadLines.push(`base_height = ${settings.baseHeight};`);
    scadLines.push(`layer_height = ${settings.heightPerLayer};`);
    scadLines.push(`width = ${image.width};`);
    scadLines.push(`height = ${image.height};`);
    scadLines.push('');

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;

        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isColor = image.pixels[y][x] === colorIdx;
                const value = isColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const pngData = canvas.toDataURL('image/png').split(',')[1];
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, pngData, { base64: true });

        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadLines.push(`// ${part.target.name} (${part.count} pixels)`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  translate([0, 0, base_height])`);
        scadLines.push(`  scale([1, 1, layer_height])`);
        scadLines.push(`  surface(file = "${filename}", center = false, invert = true);`);
        scadLines.push('');
    }

    zip.file('model.scad', scadLines.join('\n'));

    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        saveAs(content, 'pixel-art-openscad.zip');
    });
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}
