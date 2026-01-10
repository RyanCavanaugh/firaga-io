import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    heightMm: number;
    pixelSizeMm: number;
    filename: string;
};

export async function make3DExport(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await make3MFFile(image, settings);
    } else {
        await makeOpenSCADZip(image, settings);
    }
}

async function make3MFFile(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const pixelSize = settings.pixelSizeMm;
    const heightMm = settings.heightMm;

    let objectId = 2;
    const objects: string[] = [];
    const buildItems: string[] = [];

    // Create a mesh object for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Collect all pixels of this color and generate vertices/triangles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;

                    // Bottom face (z=0)
                    vertices.push([x0, y0, 0]);
                    vertices.push([x1, y0, 0]);
                    vertices.push([x1, y1, 0]);
                    vertices.push([x0, y1, 0]);

                    // Top face (z=height)
                    vertices.push([x0, y0, heightMm]);
                    vertices.push([x1, y0, heightMm]);
                    vertices.push([x1, y1, heightMm]);
                    vertices.push([x0, y1, heightMm]);

                    // Bottom face triangles
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);

                    // Top face triangles
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);

                    // Side faces
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                }
            }
        }

        if (vertices.length > 0) {
            const vertexData = vertices
                .map(([x, y, z]) => `    <vertex x="${x}" y="${y}" z="${z}" />`)
                .join('\n');

            const triangleData = triangles
                .map(([v1, v2, v3]) => `    <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`)
                .join('\n');

            const hex = colorEntryToHex(part.target).substring(1); // Remove #
            const r = part.target.r / 255;
            const g = part.target.g / 255;
            const b = part.target.b / 255;

            objects.push(`  <object id="${objectId}" type="model">
   <mesh>
    <vertices>
${vertexData}
    </vertices>
    <triangles>
${triangleData}
    </triangles>
   </mesh>
  </object>`);

            buildItems.push(`   <item objectid="${objectId}" />`);
            objectId++;
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
${objects.join('\n')}
 </resources>
 <build>
${buildItems.join('\n')}
 </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function makeOpenSCADZip(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;

    // Need JSZip library
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const scadParts: string[] = [];
    scadParts.push('// Generated by firaga.io');
    scadParts.push(`pixel_size = ${settings.pixelSizeMm};`);
    scadParts.push(`height = ${settings.heightMm};`);
    scadParts.push('');

    // Generate one black/white PNG per color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw black pixels for this color
        ctx.fillStyle = '#000000';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);

        // Add to SCAD file
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;

        scadParts.push(`// ${part.target.name} (${part.count} pixels)`);
        scadParts.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadParts.push(`  scale([pixel_size, pixel_size, height / 255])`);
        scadParts.push(`    surface(file="${filename}", center=false, invert=true);`);
        scadParts.push('');
    }

    const scadContent = scadParts.join('\n');
    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

let jsZipPromise: Promise<typeof import('jszip')> | undefined;

async function loadJSZip(): Promise<typeof import('jszip')> {
    if (jsZipPromise) {
        return jsZipPromise;
    }

    jsZipPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return jsZipPromise;
}
