import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    height: number;
    filename: string;
};

export function export3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        export3MF(image, settings);
    } else {
        exportOpenSCAD(image, settings);
    }
}

function export3MF(image: PartListImage, settings: ThreeDSettings): void {
    const xml = generate3MFContent(image, settings.height);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, heightMm: number): string {
    let meshId = 1;
    const meshes: string[] = [];
    const items: string[] = [];
    const materials: string[] = [];

    image.partList.forEach((part, colorIndex) => {
        const hexColor = colorEntryToHex(part.target).substring(1);
        materials.push(`    <basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${hexColor}" />`);

        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x;
                    const y0 = y;
                    const x1 = x + 1;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = heightMm;

                    const v = vertexId;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    triangles.push(`      <triangle v1="${v + 0}" v2="${v + 1}" v3="${v + 2}" />`);
                    triangles.push(`      <triangle v1="${v + 0}" v2="${v + 2}" v3="${v + 3}" />`);
                    triangles.push(`      <triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 5}" />`);
                    triangles.push(`      <triangle v1="${v + 4}" v2="${v + 7}" v3="${v + 6}" />`);
                    triangles.push(`      <triangle v1="${v + 0}" v2="${v + 5}" v3="${v + 1}" />`);
                    triangles.push(`      <triangle v1="${v + 0}" v2="${v + 4}" v3="${v + 5}" />`);
                    triangles.push(`      <triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 2}" />`);
                    triangles.push(`      <triangle v1="${v + 1}" v2="${v + 5}" v3="${v + 6}" />`);
                    triangles.push(`      <triangle v1="${v + 2}" v2="${v + 7}" v3="${v + 3}" />`);
                    triangles.push(`      <triangle v1="${v + 2}" v2="${v + 6}" v3="${v + 7}" />`);
                    triangles.push(`      <triangle v1="${v + 3}" v2="${v + 4}" v3="${v + 0}" />`);
                    triangles.push(`      <triangle v1="${v + 3}" v2="${v + 7}" v3="${v + 4}" />`);

                    vertexId += 8;
                }
            }
        }

        if (vertices.length > 0) {
            meshes.push(`  <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
  </mesh>`);

            items.push(`    <item objectid="${meshId}" />`);
            meshId++;
        }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${meshes.map((mesh, i) => `    <object id="${i + 2}" type="model" pid="1" pindex="${i}">\n${mesh}\n    </object>`).join('\n')}
  </resources>
  <build>
${items.map((item, i) => `    <item objectid="${i + 2}" />`).join('\n')}
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const scadLines: string[] = [];
    scadLines.push('// Generated by firaga.io');
    scadLines.push('');

    image.partList.forEach((part, colorIndex) => {
        const filename = `color_${colorIndex}.png`;
        const imgData = generateMaskImage(image, colorIndex);
        zip.file(filename, imgData.split(',')[1], { base64: true });

        const hexColor = colorEntryToHex(part.target);
        const r = parseInt(hexColor.substring(1, 3), 16) / 255;
        const g = parseInt(hexColor.substring(3, 5), 16) / 255;
        const b = parseInt(hexColor.substring(5, 7), 16) / 255;

        scadLines.push(`// ${part.target.name}`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  translate([0, 0, ${colorIndex * 0.1}])`);
        scadLines.push(`    surface(file="${filename}", center=true, invert=true, convexity=5);`);
        scadLines.push('');
    });

    scadLines.push(`// Scale factor: each pixel = 1mm`);
    scadLines.push(`// Total size: ${image.width}mm x ${image.height}mm x ${settings.height}mm`);

    zip.file('model.scad', scadLines.join('\n'));

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${settings.filename}.zip`);
}

function generateMaskImage(image: PartListImage, colorIndex: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.createImageData(image.width, image.height);

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isMatch = image.pixels[y][x] === colorIndex;
            const value = isMatch ? 0 : 255;
            
            imageData.data[idx + 0] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

async function loadJSZip(): Promise<any> {
    if (typeof (window as any).JSZip !== 'undefined') {
        return (window as any).JSZip;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
