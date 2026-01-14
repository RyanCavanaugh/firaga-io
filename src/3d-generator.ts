import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export interface ThreeDSettings {
    format: '3mf' | 'openscad-masks';
    heightScale: number;
    filename: string;
}

declare const JSZip: any;

export async function make3mf(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, pixels, partList } = image;

    // Group pixels by color
    const colorMap = new Map<string, Array<{ x: number; y: number }>>();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const partIdx = pixels[y][x];
            if (partIdx !== undefined && partIdx !== null) {
                const part = partList[partIdx];
                if (!part) continue;
                const color = colorEntryToHex(part.color);
                if (!colorMap.has(color)) {
                    colorMap.set(color, []);
                }
                colorMap.get(color)!.push({ x, y });
            }
        }
    }

    // Build single mesh with all colored pixels
    const vertices: string[] = [];
    const triangles: string[] = [];
    const vertexMap = new Map<string, number>();
    let vertexIndex = 1;

    for (const [color, pixelList] of colorMap.entries()) {
        for (const pixel of pixelList) {
            const x = pixel.x;
            const y = pixel.y;
            const z = settings.heightScale;

            // Create 8 vertices for a cube
            const corners = [
                [x, y, 0],
                [x + 1, y, 0],
                [x + 1, y + 1, 0],
                [x, y + 1, 0],
                [x, y, z],
                [x + 1, y, z],
                [x + 1, y + 1, z],
                [x, y + 1, z],
            ];

            const localVertices: number[] = [];
            for (const corner of corners) {
                const key = corner.join(',');
                if (!vertexMap.has(key)) {
                    vertexMap.set(key, vertexIndex);
                    vertices.push(
                        `<vertex x="${corner[0]}" y="${corner[1]}" z="${corner[2]}" />`
                    );
                    localVertices.push(vertexIndex);
                    vertexIndex++;
                } else {
                    localVertices.push(vertexMap.get(key)!);
                }
            }

            const v = localVertices;
            // Create 12 triangles for cube faces
            triangles.push(`<triangle v1="${v[0]}" v2="${v[1]}" v3="${v[2]}" />`);
            triangles.push(`<triangle v1="${v[0]}" v2="${v[2]}" v3="${v[3]}" />`);
            triangles.push(`<triangle v1="${v[4]}" v2="${v[6]}" v3="${v[5]}" />`);
            triangles.push(`<triangle v1="${v[4]}" v2="${v[7]}" v3="${v[6]}" />`);
            triangles.push(`<triangle v1="${v[0]}" v2="${v[4]}" v3="${v[5]}" />`);
            triangles.push(`<triangle v1="${v[0]}" v2="${v[5]}" v3="${v[1]}" />`);
            triangles.push(`<triangle v1="${v[1]}" v2="${v[5]}" v3="${v[6]}" />`);
            triangles.push(`<triangle v1="${v[1]}" v2="${v[6]}" v3="${v[2]}" />`);
            triangles.push(`<triangle v1="${v[2]}" v2="${v[6]}" v3="${v[7]}" />`);
            triangles.push(`<triangle v1="${v[2]}" v2="${v[7]}" v3="${v[3]}" />`);
            triangles.push(`<triangle v1="${v[3]}" v2="${v[7]}" v3="${v[4]}" />`);
            triangles.push(`<triangle v1="${v[3]}" v2="${v[4]}" v3="${v[0]}" />`);
        }
    }

    const meshXml = `
        <mesh>
            <vertices>
                ${vertices.join('\n                ')}
            </vertices>
            <triangles>
                ${triangles.join('\n                ')}
            </triangles>
        </mesh>`;

    const threeMfContent = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <metadata name="Application">firaga.io</metadata>
    <resources>
        <object id="1" type="model">
            ${meshXml}
        </object>
    </resources>
    <build>
        <item objectid="1" />
    </build>
</model>`;

    // Create 3MF zip file
    await loadJSZipAndExecute(async (JSZipLib: any) => {
        const zip = new JSZipLib();
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmodel+xml" />
</Types>`);

        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="3D/model.model" />
</Relationships>`);

        zip.file('3D/model.model', threeMfContent);

        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, `${settings.filename}.3mf`);
    });
}

export async function makeOpenScadMasks(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, pixels, partList } = image;

    // Group pixels by color
    const colorMap = new Map<string, boolean[][]>();
    const colorNames = new Map<string, string>();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const partIdx = pixels[y][x];
            if (partIdx !== undefined && partIdx !== null) {
                const part = partList[partIdx];
                if (!part) continue;
                const color = colorEntryToHex(part.color);
                if (!colorMap.has(color)) {
                    const grid: boolean[][] = [];
                    for (let i = 0; i < height; i++) {
                        grid[i] = [];
                        for (let j = 0; j < width; j++) {
                            grid[i][j] = false;
                        }
                    }
                    colorMap.set(color, grid);
                    colorNames.set(color, part.color.name);
                }
                const grid = colorMap.get(color)!;
                grid[y][x] = true;
            }
        }
    }

    // Create mask images and OpenSCAD script
    const masks: Array<{ name: string; color: string }> = [];
    for (const [color] of colorMap.entries()) {
        const safeName = color.substring(1).toLowerCase();
        masks.push({
            name: `mask_${safeName}.png`,
            color: color
        });
    }

    const scadScript = generateOpenScadScript(width, height, masks, settings.heightScale);

    const readme = `# 3D Model from firaga.io

This package contains:
- masks/: Directory with black/white PNG images for each color
- model.scad: OpenSCAD script that loads all masks and creates a 3D model

To use:
1. Open model.scad in OpenSCAD
2. Render (F6) to generate the 3D model
3. Export as STL or other formats

You can modify the HEIGHT_SCALE parameter in model.scad to adjust the height of peaks.
`;

    // Create zip with masks
    await loadJSZipAndExecute(async (JSZipLib: any) => {
        const zip = new JSZipLib();

        // Add mask PNG files
        for (const [color, grid] of colorMap.entries()) {
            const safeName = color.substring(1).toLowerCase();
            const pngBlob = await createPNGFromGrid(width, height, grid);
            zip.file(`masks/mask_${safeName}.png`, pngBlob);
        }

        zip.file('model.scad', scadScript);
        zip.file('README.txt', readme);

        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, `${settings.filename}-openscad.zip`);
    });
}

function generateOpenScadScript(
    width: number,
    height: number,
    masks: Array<{ name: string; color: string }>,
    heightScale: number
): string {
    return `// 3D Model generated by firaga.io
// Adjust HEIGHT_SCALE below to change the height of the 3D model

HEIGHT_SCALE = ${heightScale};
IMAGE_WIDTH = ${width};
IMAGE_HEIGHT = ${height};

// Layer: Load and display all color masks
union() {
${masks.map(mask => {
    const safeName = mask.color.substring(1).toLowerCase();
    return `    surface(file = "masks/mask_${safeName}.png", center = true, invert = true)
        scale([1, 1, HEIGHT_SCALE])
        color("${mask.color}")
        cube([IMAGE_WIDTH, IMAGE_HEIGHT, 1]);`;
}).join('\n\n')}
}
`;
}

async function createPNGFromGrid(width: number, height: number, grid: boolean[][]): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const val = grid[y][x] ? 255 : 0;
                const idx = (y * width + x) * 4;
                imageData.data[idx] = val;
                imageData.data[idx + 1] = val;
                imageData.data[idx + 2] = val;
                imageData.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Could not create blob'));
            }
        }, 'image/png');
    });
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZipAndExecute(callback: (JSZipLib: any) => Promise<void>) {
    // Load JSZip from CDN if not already loaded
    if (typeof window !== 'undefined' && (window as any).JSZip) {
        await callback((window as any).JSZip);
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = async () => {
            await callback((window as any).JSZip);
        };
        script.onerror = () => {
            console.error('Failed to load JSZip');
        };
        document.head.appendChild(script);
    }
}
