import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    filename: string;
    pitch: number;
    height: number;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await make3MF(image, settings);
    } else {
        await makeOpenSCAD(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexIndex = 0;

    const colorObjects: Array<{ id: number; color: string; triangles: string[] }> = [];

    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const color = colorEntryToHex(part.target);
        const objectTriangles: string[] = [];

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x0 = x * settings.pitch;
                    const y0 = y * settings.pitch;
                    const x1 = (x + 1) * settings.pitch;
                    const y1 = (y + 1) * settings.pitch;
                    const z0 = 0;
                    const z1 = settings.height;

                    const v0 = vertexIndex++;
                    const v1 = vertexIndex++;
                    const v2 = vertexIndex++;
                    const v3 = vertexIndex++;
                    const v4 = vertexIndex++;
                    const v5 = vertexIndex++;
                    const v6 = vertexIndex++;
                    const v7 = vertexIndex++;

                    vertices.push(`    <vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`    <vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`    <vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`    <vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`    <vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`    <vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`    <vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`    <vertex x="${x0}" y="${y1}" z="${z1}"/>`);

                    // Bottom face
                    objectTriangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}"/>`);
                    objectTriangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}"/>`);
                    // Top face
                    objectTriangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}"/>`);
                    objectTriangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}"/>`);
                    // Front face
                    objectTriangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}"/>`);
                    objectTriangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}"/>`);
                    // Back face
                    objectTriangles.push(`      <triangle v1="${v3}" v2="${v7}" v3="${v6}"/>`);
                    objectTriangles.push(`      <triangle v1="${v3}" v2="${v6}" v3="${v2}"/>`);
                    // Left face
                    objectTriangles.push(`      <triangle v1="${v0}" v2="${v4}" v3="${v7}"/>`);
                    objectTriangles.push(`      <triangle v1="${v0}" v2="${v7}" v3="${v3}"/>`);
                    // Right face
                    objectTriangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}"/>`);
                    objectTriangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}"/>`);
                }
            }
        }

        if (objectTriangles.length > 0) {
            colorObjects.push({
                id: partIndex + 2,
                color: color.substring(1),
                triangles: objectTriangles
            });
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
${colorObjects.map(obj => `      <base name="${image.partList[obj.id - 2].target.name}" displaycolor="#${obj.color}"/>`).join('\n')}
    </basematerials>
    <object id="1" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${colorObjects.map((obj, idx) => obj.triangles.map(t => t.replace('/>', ` pid="1" p1="${idx}"/>`)).join('\n')).join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    const scadLines: string[] = [];
    scadLines.push('// Generated by firaga.io');
    scadLines.push('');
    scadLines.push(`pixel_size = ${settings.pitch};`);
    scadLines.push(`height = ${settings.height};`);
    scadLines.push(`image_width = ${image.width};`);
    scadLines.push(`image_height = ${image.height};`);
    scadLines.push('');

    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        zip.file(filename, blob);
        
        const color = hexToRgb(colorEntryToHex(part.target));
        scadLines.push(`// ${part.target.name}`);
        scadLines.push(`color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])`);
        scadLines.push(`  scale([pixel_size, pixel_size, height])`);
        scadLines.push(`    translate([-image_width/2, -image_height/2, 0])`);
        scadLines.push(`      surface(file = "${filename}", center = false, invert = true);`);
        scadLines.push('');
    }

    const scadContent = scadLines.join('\n');
    zip.file(`${settings.filename}.scad`, scadContent);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}
