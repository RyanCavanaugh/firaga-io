import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, pixelDepth } = settings;

    // Build meshes for each color
    const meshes: string[] = [];
    const materials: string[] = [];

    partList.forEach((part, colorIndex) => {
        const hexColor = colorEntryToHex(part.target);
        const rgb = hexToRgb(hexColor);
        
        // Create material
        materials.push(`  <basematerials id="material_${colorIndex}">
    <base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />
  </basematerials>`);

        // Build mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = pixelDepth;

                    // 8 vertices of cube
                    const verts = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];

                    verts.forEach(v => {
                        vertices.push(`      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
                    });

                    const baseIdx = vertexIndex;
                    // 12 triangles (2 per face, 6 faces)
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];

                    faces.forEach(f => {
                        triangles.push(`      <triangle v1="${baseIdx + f[0]}" v2="${baseIdx + f[1]}" v3="${baseIdx + f[2]}" />`);
                    });

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            meshes.push(`  <object id="object_${colorIndex}" name="${escapeXml(part.target.name)}" type="model">
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

    // Generate 3MF file
    const content3MF = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${meshes.join('\n')}
  </resources>
  <build>
${partList.map((_, idx) => `    <item objectid="object_${idx}" />`).filter((_, idx) => meshes[idx]).join('\n')}
  </build>
</model>`;

    const blob = new Blob([content3MF], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const { width, height, partList, pixels } = image;
    const { pixelWidth, pixelHeight, pixelDepth } = settings;

    // Create one image per color
    const scadParts: string[] = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
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
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
        
        const hexColor = colorEntryToHex(part.target);
        scadParts.push(`  // ${part.target.name}
  color("${hexColor}")
    surface(file="${filename}", center=true, invert=true)
      scale([${pixelWidth}, ${pixelHeight}, ${pixelDepth}]);`);
    }

    // Generate OpenSCAD file
    const scadContent = `// Generated by firaga.io
// Image: ${settings.filename}
// Size: ${width}x${height} pixels

$fn = 20;

union() {
${scadParts.join('\n')}
}
`;

    zip.file(`${settings.filename}.scad`, scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#808080';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `#${result[1]}${result[2]}${result[3]}`;
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
