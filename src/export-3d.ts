import { PartListImage } from './image-utils';
import { getPitch } from './utils';
import JSZip from 'jszip';
import { AppProps } from './types';

export type Export3DSettings = {
    format: '3mf' | 'openscad';
    gridSize: AppProps["material"]["size"];
    height: number;
    filename: string;
};

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const pitch = getPitch(settings.gridSize);
    
    if (settings.format === '3mf') {
        await export3MF(image, settings, pitch);
    } else {
        await exportOpenSCAD(image, settings, pitch);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings, pitch: number): Promise<void> {
    const { saveAs } = await import('file-saver');
    
    const zip = new JSZip();
    
    // Add required 3MF file structure
    zip.file('[Content_Types].xml', createContentTypesXml());
    zip.file('_rels/.rels', createRelsXml());
    
    const modelXml = generate3MF(image, settings, pitch);
    zip.file('3D/3dmodel.model', modelXml);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function createContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function createRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3MF(image: PartListImage, settings: Export3DSettings, pitch: number): string {
    const models: string[] = [];
    const buildItems: string[] = [];
    let objectId = 1;
    
    // Create separate mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const voxelVertices = createVoxelVertices(x, y, pitch, settings.height);
                    const baseIdx = vertices.length;
                    vertices.push(...voxelVertices);
                    triangles.push(...createVoxelTriangles(baseIdx));
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshXml = createMeshXml(vertices, triangles);
            const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
            models.push(`<object id="${objectId}" type="model" name="${color.target.name}">
  ${meshXml}
</object>`);
            buildItems.push(`<item objectid="${objectId}" />`);
            objectId++;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${models.join('\n    ')}
  </resources>
  <build>
    ${buildItems.join('\n    ')}
  </build>
</model>`;
}

function createVoxelVertices(x: number, y: number, pitch: number, height: number): Array<[number, number, number]> {
    const x0 = x * pitch;
    const x1 = (x + 1) * pitch;
    const y0 = y * pitch;
    const y1 = (y + 1) * pitch;
    const z0 = 0;
    const z1 = height;
    
    return [
        // Bottom face
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
        // Top face
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
    ];
}

function createVoxelTriangles(baseIdx: number): Array<[number, number, number]> {
    const b = baseIdx;
    return [
        // Bottom face
        [b + 0, b + 2, b + 1], [b + 0, b + 3, b + 2],
        // Top face
        [b + 4, b + 5, b + 6], [b + 4, b + 6, b + 7],
        // Front face
        [b + 0, b + 1, b + 5], [b + 0, b + 5, b + 4],
        // Right face
        [b + 1, b + 2, b + 6], [b + 1, b + 6, b + 5],
        // Back face
        [b + 2, b + 3, b + 7], [b + 2, b + 7, b + 6],
        // Left face
        [b + 3, b + 0, b + 4], [b + 3, b + 4, b + 7]
    ];
}

function createMeshXml(vertices: Array<[number, number, number]>, triangles: Array<[number, number, number]>): string {
    const verticesXml = vertices.map(([x, y, z]) => 
        `<vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />`
    ).join('\n    ');
    
    const trianglesXml = triangles.map(([v1, v2, v3]) => 
        `<triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
    ).join('\n    ');
    
    return `<mesh>
    <vertices>
      ${verticesXml}
    </vertices>
    <triangles>
      ${trianglesXml}
    </triangles>
  </mesh>`;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings, pitch: number): Promise<void> {
    const { saveAs } = await import('file-saver');
    
    const zip = new JSZip();
    const scadLines: string[] = [];
    
    scadLines.push('// Generated by firaga.io');
    scadLines.push(`// Image: ${settings.filename}`);
    scadLines.push(`// Size: ${image.width}x${image.height}`);
    scadLines.push('');
    
    // Generate a PNG mask for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const filename = `color_${colorIdx}_${sanitizeFilename(color.target.name)}.png`;
        const pngBlob = await generateMaskPNG(image, colorIdx);
        zip.file(filename, pngBlob);
        
        const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
        scadLines.push(`// ${color.target.name} (${colorHex})`);
        scadLines.push(`color("${colorHex}")`);
        scadLines.push(`translate([0, 0, ${colorIdx * 0.1}])`);
        scadLines.push(`scale([${pitch}, ${pitch}, ${settings.height}])`);
        scadLines.push(`surface(file = "${filename}", center = false, invert = false);`);
        scadLines.push('');
    }
    
    const scadContent = scadLines.join('\n');
    zip.file('model.scad', scadContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

async function generateMaskPNG(image: PartListImage, colorIdx: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColorMatch = image.pixels[y][x] === colorIdx;
            const value = isColorMatch ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to PNG blob
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create PNG blob'));
            }
        }, 'image/png');
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}
