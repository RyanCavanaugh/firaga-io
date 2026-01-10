import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DSettings = {
    format: '3mf' | 'openscad';
    filename: string;
    pitch: number;
    height: number;
};

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { pitch, height } = settings;
    const meshes: string[] = [];
    const resources: string[] = [];
    const components: string[] = [];
    
    let resourceId = 1;
    let meshId = 1;
    
    // Create a mesh for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices for a cube
                    const baseIdx = vertexIndex;
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}"/>`
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}"/>`,
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}"/>`
                    );
                    // Top face
                    triangles.push(
                        `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}"/>`,
                        `<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}"/>`
                    );
                    // Front face
                    triangles.push(
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}"/>`,
                        `<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}"/>`
                    );
                    // Back face
                    triangles.push(
                        `<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}"/>`,
                        `<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}"/>`
                    );
                    // Left face
                    triangles.push(
                        `<triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}"/>`,
                        `<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}"/>`
                    );
                    // Right face
                    triangles.push(
                        `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}"/>`,
                        `<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}"/>`
                    );
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = colorEntryToHex(part.target).substring(1); // Remove #
            const r = parseInt(colorHex.substring(0, 2), 16);
            const g = parseInt(colorHex.substring(2, 4), 16);
            const b = parseInt(colorHex.substring(4, 6), 16);
            
            const colorId = resourceId++;
            const currentMeshId = meshId++;
            
            resources.push(
                `<basematerials id="${colorId}">`,
                `  <base name="${part.target.name}" displaycolor="#${colorHex}"/>`,
                `</basematerials>`
            );
            
            meshes.push(
                `<object id="${currentMeshId}" type="model">`,
                `  <mesh>`,
                `    <vertices>`,
                ...vertices.map(v => `      ${v}`),
                `    </vertices>`,
                `    <triangles>`,
                ...triangles.map(t => `      ${t} pid="0" p1="${colorId}"/>`),
                `    </triangles>`,
                `  </mesh>`,
                `</object>`
            );
            
            components.push(`<component objectid="${currentMeshId}"/>`);
        }
    }
    
    const buildId = resourceId++;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
${meshes.join('\n')}
    <object id="${buildId}" type="model">
      <components>
${components.map(c => `        ${c}`).join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${buildId}"/>
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const { pitch, height } = settings;
    const scadLines: string[] = [
        '// Generated by firaga.io',
        '// This creates a 3D representation of the image with each color as a separate layer',
        '',
        `pitch = ${pitch};`,
        `height = ${height};`,
        '',
    ];
    
    // Generate a mask image for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background/transparent)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const pngData = await canvasToPngBlob(canvas);
        const filename = `mask_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, pngData);
        
        // Add layer to SCAD file using the surface function
        const colorHex = colorEntryToHex(part.target);
        const r = parseInt(colorHex.substring(1, 3), 16) / 255;
        const g = parseInt(colorHex.substring(3, 5), 16) / 255;
        const b = parseInt(colorHex.substring(5, 7), 16) / 255;
        
        scadLines.push(
            `// Layer for ${part.target.name}`,
            `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`,
            `  scale([pitch, pitch, height])`,
            `    surface(file = "${filename}", center = false, invert = true);`,
            ''
        );
    }
    
    // Add the SCAD file to zip
    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, 'image/png');
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
