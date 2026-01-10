import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

const saveAs: typeof import("file-saver").saveAs = (window as any).saveAs;

export type Export3DFormat = "3mf" | "openscad";

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    pitch: number;
    height: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList, pixels } = image;
    const pixelPitch = settings.pitch;
    const pixelHeight = settings.height;

    const meshes: string[] = [];
    const resources: string[] = [];
    const items: string[] = [];

    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const part = partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];

        let vertexId = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] !== colorIndex) continue;

                const x0 = x * pixelPitch;
                const x1 = (x + 1) * pixelPitch;
                const y0 = y * pixelPitch;
                const y1 = (y + 1) * pixelPitch;
                const z0 = 0;
                const z1 = pixelHeight;

                const baseVertex = vertexId;

                vertices.push(
                    `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
                    `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
                    `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
                    `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
                    `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
                    `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
                    `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
                    `<vertex x="${x0}" y="${y1}" z="${z1}" />`
                );
                vertexId += 8;

                triangles.push(
                    `<triangle v1="${baseVertex}" v2="${baseVertex + 1}" v3="${baseVertex + 2}" />`,
                    `<triangle v1="${baseVertex}" v2="${baseVertex + 2}" v3="${baseVertex + 3}" />`,
                    `<triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`,
                    `<triangle v1="${baseVertex + 4}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`,
                    `<triangle v1="${baseVertex}" v2="${baseVertex + 4}" v3="${baseVertex + 5}" />`,
                    `<triangle v1="${baseVertex}" v2="${baseVertex + 5}" v3="${baseVertex + 1}" />`,
                    `<triangle v1="${baseVertex + 1}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`,
                    `<triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 2}" />`,
                    `<triangle v1="${baseVertex + 2}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`,
                    `<triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />`,
                    `<triangle v1="${baseVertex + 3}" v2="${baseVertex + 7}" v3="${baseVertex + 4}" />`,
                    `<triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex}" />`
                );
            }
        }

        if (vertices.length > 0) {
            const meshId = colorIndex + 1;
            const colorHex = colorEntryToHex(part.target).substring(1);
            
            resources.push(
                `<basematerials id="${meshId}">`,
                `  <base name="${part.target.name}" displaycolor="#${colorHex}" />`,
                `</basematerials>`
            );
            
            meshes.push(
                `<object id="${meshId + partList.length}" type="model">`,
                `  <mesh>`,
                `    <vertices>`,
                ...vertices.map(v => `      ${v}`),
                `    </vertices>`,
                `    <triangles>`,
                ...triangles.map(t => `      ${t}`),
                `    </triangles>`,
                `  </mesh>`,
                `</object>`
            );
            
            items.push(`<item objectid="${meshId + partList.length}" />`);
        }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
${meshes.join('\n')}
  </resources>
  <build>
${items.map(i => `    ${i}`).join('\n')}
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const { width, height, partList, pixels } = image;

    const scadLines: string[] = [
        `// Generated by firaga.io`,
        `// Pixel pitch: ${settings.pitch}mm`,
        `// Height: ${settings.height}mm`,
        ``,
        `pixel_pitch = ${settings.pitch};`,
        `pixel_height = ${settings.height};`,
        ``,
        `union() {`
    ];

    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const part = partList[colorIndex];
        const imageData = createMaskImage(image, colorIndex);
        const filename = `mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        
        zip.file(filename, imageData.split(',')[1]!, { base64: true });

        const colorHex = colorEntryToHex(part.target);
        scadLines.push(
            `  // ${part.target.name} (${colorHex})`,
            `  color("${colorHex}")`,
            `    scale([pixel_pitch, pixel_pitch, pixel_height])`,
            `      surface(file = "${filename}", center = true, invert = true);`
        );
    }

    scadLines.push(`}`);

    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.zip`);
}

function createMaskImage(image: PartListImage, colorIndex: number): string {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;

    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelIndex = (y * image.width + x) * 4;
            const isCurrentColor = image.pixels[y][x] === colorIndex;
            
            const value = isCurrentColor ? 255 : 0;
            imageData.data[pixelIndex] = value;
            imageData.data[pixelIndex + 1] = value;
            imageData.data[pixelIndex + 2] = value;
            imageData.data[pixelIndex + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

async function loadJSZip(): Promise<typeof import("jszip")> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
    
    return (window as any).JSZip;
}
