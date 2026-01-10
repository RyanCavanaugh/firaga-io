import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export interface ThreeDExportSettings {
    format: '3mf' | 'openscad';
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
    baseThickness: number;
}

export async function export3D(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const materials: string[] = [];
    const meshes: string[] = [];
    
    // Generate materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        materials.push(
            `    <basematerials id="${idx + 2}">`,
            `      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`,
            `    </basematerials>`
        );
    });
    
    // Generate mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const cubeVerts = createCube(
                        x * settings.pixelWidth,
                        y * settings.pixelHeight,
                        0,
                        settings.pixelWidth,
                        settings.pixelHeight,
                        settings.pixelDepth
                    );
                    
                    const startIdx = vertexCount;
                    cubeVerts.vertices.forEach(v => {
                        vertices.push(`        <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`);
                    });
                    
                    cubeVerts.triangles.forEach(t => {
                        triangles.push(`        <triangle v1="${t.v1 + startIdx}" v2="${t.v2 + startIdx}" v3="${t.v3 + startIdx}" />`);
                    });
                    
                    vertexCount += cubeVerts.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            meshes.push(
                `    <object id="${colorIdx + 3}" name="${escapeXml(image.partList[colorIdx].target.name)}" partnumber="${escapeXml(image.partList[colorIdx].target.code ?? '')}" type="model">`,
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
        }
    }
    
    const model = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">`,
        `  <resources>`,
        ...materials,
        ...meshes,
        `    <object id="1" type="model">`,
        `      <components>`,
        ...image.partList.map((_, idx) => `        <component objectid="${idx + 3}" />`).filter((_, idx) => {
            // Only include components that have meshes
            return meshes.some(m => m.includes(`id="${idx + 3}"`));
        }),
        `      </components>`,
        `    </object>`,
        `  </resources>`,
        `  <build>`,
        `    <item objectid="1" />`,
        `  </build>`,
        `</model>`
    ].join('\n');
    
    const rels = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
        `  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />`,
        `</Relationships>`
    ].join('\n');
    
    const contentTypes = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
        `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />`,
        `  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />`,
        `</Types>`
    ].join('\n');
    
    // Create zip file with JSZip
    await createZipAndDownload(
        [
            { path: '3D/3dmodel.model', content: model },
            { path: '_rels/.rels', content: rels },
            { path: '[Content_Types].xml', content: contentTypes }
        ],
        'model.3mf'
    );
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const files: Array<{ path: string; content: string | Uint8Array }> = [];
    const scadLines: string[] = [
        `// Generated by firaga.io`,
        `// OpenSCAD heightmap display`,
        ``,
        `pixel_width = ${settings.pixelWidth};`,
        `pixel_height = ${settings.pixelHeight};`,
        `pixel_depth = ${settings.pixelDepth};`,
        ``,
        `module color_layer(image_file, color) {`,
        `    color(color)`,
        `    surface(file=image_file, invert=true, center=false);`,
        `}`,
        ``
    ];
    
    // Create a mask image for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        
        // Create black/white image
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
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
        
        // Convert to PNG blob
        const blob = await new Promise<Blob | null>(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            files.push({
                path: filename,
                content: new Uint8Array(arrayBuffer)
            });
            
            const hex = colorEntryToHex(part.target).substring(1);
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            
            scadLines.push(
                `// ${part.target.name}${part.target.code ? ' (' + part.target.code + ')' : ''}`,
                `translate([0, 0, ${colorIdx * 0.1}])`,
                `scale([pixel_width, pixel_height, pixel_depth])`,
                `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`,
                `color_layer("${filename}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);`,
                ``
            );
        }
    }
    
    files.push({
        path: 'model.scad',
        content: scadLines.join('\n')
    });
    
    await createZipAndDownload(files, 'openscad_export.zip');
}

interface Vertex {
    x: number;
    y: number;
    z: number;
}

interface Triangle {
    v1: number;
    v2: number;
    v3: number;
}

function createCube(x: number, y: number, z: number, w: number, h: number, d: number): { vertices: Vertex[]; triangles: Triangle[] } {
    const vertices: Vertex[] = [
        { x, y, z },
        { x: x + w, y, z },
        { x: x + w, y: y + h, z },
        { x, y: y + h, z },
        { x, y, z: z + d },
        { x: x + w, y, z: z + d },
        { x: x + w, y: y + h, z: z + d },
        { x, y: y + h, z: z + d }
    ];
    
    const triangles: Triangle[] = [
        // Bottom
        { v1: 0, v2: 1, v3: 2 },
        { v1: 0, v2: 2, v3: 3 },
        // Top
        { v1: 4, v2: 6, v3: 5 },
        { v1: 4, v2: 7, v3: 6 },
        // Front
        { v1: 0, v2: 4, v3: 5 },
        { v1: 0, v2: 5, v3: 1 },
        // Back
        { v1: 2, v2: 6, v3: 7 },
        { v1: 2, v2: 7, v3: 3 },
        // Left
        { v1: 0, v2: 3, v3: 7 },
        { v1: 0, v2: 7, v3: 4 },
        // Right
        { v1: 1, v2: 5, v3: 6 },
        { v1: 1, v2: 6, v3: 2 }
    ];
    
    return { vertices, triangles };
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function createZipAndDownload(files: Array<{ path: string; content: string | Uint8Array }>, filename: string): Promise<void> {
    // Load JSZip dynamically
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    for (const file of files) {
        zip.file(file.path, file.content);
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, filename);
}

async function loadJSZip(): Promise<any> {
    const tagName = 'jszip-script-tag';
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve, reject) => {
            const tag = document.createElement('script');
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.onerror = reject;
            tag.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            document.head.appendChild(tag);
        });
    } else {
        return (window as any).JSZip;
    }
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
