import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
};

declare const JSZip: any;

export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        loadJSZipAnd(() => generateOpenSCADMasks(image, settings));
    }
}

async function loadJSZipAnd(func: () => void): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, pixelDepth } = settings;

    let meshId = 1;
    const meshes: string[] = [];
    const materials: string[] = [];
    const buildItems: string[] = [];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const hexColor = colorEntryToHex(color.target).substring(1);
        
        materials.push(
            `    <basematerials id="${colorIdx + 1}">`,
            `      <base name="${escapeXml(color.target.name)}" displaycolor="#${hexColor}" />`,
            `    </basematerials>`
        );

        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = pixelDepth;

                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
                    );

                    triangles.push(
                        [baseIdx + 0, baseIdx + 1, baseIdx + 2], [baseIdx + 0, baseIdx + 2, baseIdx + 3],
                        [baseIdx + 4, baseIdx + 6, baseIdx + 5], [baseIdx + 4, baseIdx + 7, baseIdx + 6],
                        [baseIdx + 0, baseIdx + 5, baseIdx + 1], [baseIdx + 0, baseIdx + 4, baseIdx + 5],
                        [baseIdx + 1, baseIdx + 6, baseIdx + 2], [baseIdx + 1, baseIdx + 5, baseIdx + 6],
                        [baseIdx + 2, baseIdx + 7, baseIdx + 3], [baseIdx + 2, baseIdx + 6, baseIdx + 7],
                        [baseIdx + 3, baseIdx + 4, baseIdx + 0], [baseIdx + 3, baseIdx + 7, baseIdx + 4]
                    );
                }
            }
        }

        if (vertices.length > 0) {
            const vertexLines = vertices.map(([x, y, z]) => 
                `        <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />`
            );
            const triangleLines = triangles.map(([v1, v2, v3]) => 
                `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
            );

            meshes.push(
                `    <object id="${meshId}" name="${escapeXml(color.target.name)}" type="model" pid="${colorIdx + 1}" pindex="0">`,
                `      <mesh>`,
                `        <vertices>`,
                ...vertexLines,
                `        </vertices>`,
                `        <triangles>`,
                ...triangleLines,
                `        </triangles>`,
                `      </mesh>`,
                `    </object>`
            );

            buildItems.push(`    <item objectid="${meshId}" />`);
            meshId++;
        }
    }

    const xml = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">`,
        `  <resources>`,
        ...materials,
        ...meshes,
        `  </resources>`,
        `  <build>`,
        ...buildItems,
        `  </build>`,
        `</model>`
    ].join('\n');

    downloadFile(`${settings.filename}.3mf`, xml, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): void {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, pixelDepth } = settings;

    const files: Array<{ name: string; content: string | Uint8Array; type: string }> = [];

    const scadLines: string[] = [
        `// Generated by firaga.io`,
        ``,
        `pixel_width = ${pixelWidth};`,
        `pixel_height = ${pixelHeight};`,
        `pixel_depth = ${pixelDepth};`,
        `image_width = ${width};`,
        `image_height = ${height};`,
        ``,
    ];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const sanitizedName = color.target.name.replace(/[^a-zA-Z0-9_]/g, '_');
        const filename = `mask_${colorIdx}_${sanitizedName}.png`;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        files.push({ name: filename, content: bytes, type: 'image/png' });

        const hexColor = colorEntryToHex(color.target).substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) / 255;
        const g = parseInt(hexColor.substring(2, 4), 16) / 255;
        const b = parseInt(hexColor.substring(4, 6), 16) / 255;

        scadLines.push(
            `// ${color.target.name}${color.target.code ? ' (' + color.target.code + ')' : ''}`,
            `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`,
            `  scale([pixel_width, pixel_height, pixel_depth])`,
            `  surface(file = "${filename}", center = false, invert = true);`,
            ``
        );
    }

    files.push({ name: 'model.scad', content: scadLines.join('\n'), type: 'text/plain' });

    createZipAndDownload(files, `${settings.filename}.zip`);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function createZipAndDownload(
    files: Array<{ name: string; content: string | Uint8Array; type: string }>,
    zipFilename: string
): Promise<void> {
    const zip = new JSZip();
    
    for (const file of files) {
        zip.file(file.name, file.content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
