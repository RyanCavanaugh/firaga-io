import { PartListImage } from "./image-utils";

declare const JSZip: typeof import("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    pixelSize: number;
}

export async function makeThreeD(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await loadJSZipAnd(() => makeOpenSCADMasks(image, settings));
    }
}

async function loadJSZipAnd(func: () => void) {
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

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, pixelHeight } = settings;
    let vertexId = 1;
    let triangleId = 1;
    let objectId = 1;

    const colorMaterials: string[] = [];
    const objects: string[] = [];
    const buildItems: string[] = [];

    // Generate materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        colorMaterials.push(`    <basematerials id="${idx + 1}">
      <base name="${color.name}" displaycolor="${hexColor}" />
    </basematerials>`);
    });

    // Generate mesh objects for each color
    image.partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;

        // Collect all pixels of this color
        const pixels: [number, number][] = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    pixels.push([x, y]);
                }
            }
        }

        if (pixels.length === 0) return;

        // Create boxes for each pixel
        pixels.forEach(([px, py]) => {
            const x0 = px * pixelSize;
            const y0 = py * pixelSize;
            const x1 = (px + 1) * pixelSize;
            const y1 = (py + 1) * pixelSize;
            const z0 = 0;
            const z1 = pixelHeight;

            // 8 vertices of a box
            const v = [
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
            ];

            const baseVertex = localVertexId;
            v.forEach(([vx, vy, vz]) => {
                vertices.push(`      <vertex x="${vx}" y="${vy}" z="${vz}" />`);
                localVertexId++;
            });

            // 12 triangles (2 per face, 6 faces)
            const faces = [
                [0, 1, 2], [0, 2, 3], // bottom
                [4, 6, 5], [4, 7, 6], // top
                [0, 4, 5], [0, 5, 1], // front
                [1, 5, 6], [1, 6, 2], // right
                [2, 6, 7], [2, 7, 3], // back
                [3, 7, 4], [3, 4, 0]  // left
            ];

            faces.forEach(([a, b, c]) => {
                triangles.push(`      <triangle v1="${baseVertex + a}" v2="${baseVertex + b}" v3="${baseVertex + c}" />`);
            });
        });

        if (vertices.length > 0) {
            objects.push(`  <object id="${objectId}" type="model" pid="${partIndex + 1}" pindex="0">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);

            buildItems.push(`    <item objectid="${objectId}" />`);
            objectId++;
        }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${colorMaterials.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const { pixelSize, pixelHeight } = settings;

    // Create monochrome images for each color
    const imagePromises = image.partList.map(async (part, partIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);

        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to blob
        return new Promise<{ name: string, blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({ name: `${colorName}.png`, blob: blob! });
            });
        });
    });

    const imageBlobs = await Promise.all(imagePromises);
    imageBlobs.forEach(({ name, blob }) => {
        zip.file(name, blob);
    });

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADContent(image, settings);
    zip.file('model.scad', scadContent);

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${settings.filename}.zip`);
}

function generateOpenSCADContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, pixelHeight } = settings;
    const layers: string[] = [];

    image.partList.forEach((part) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);

        layers.push(`  color([${r}, ${g}, ${b}])
    surface(file="${colorName}.png", center=true, invert=true)
    scale([${pixelSize}, ${pixelSize}, ${pixelHeight}]);`);
    });

    return `// Generated 3D model from firaga.io
// Image size: ${image.width}x${image.height}

union() {
${layers.join('\n')}
}
`;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
