import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    depth: number;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    await load3DLibsAnd(() => make3DWorker(image, settings));
}

async function load3DLibsAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

function make3DWorker(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const depth = settings.depth;

    // Build 3MF XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';

    let vertexId = 1;
    let triangleOffset = 0;

    // Create a separate object for each color
    partList.forEach((part, colorIndex) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove '#'
        
        xml += `    <object id="${colorIndex + 1}" type="model">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';

        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Generate vertices and faces for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a box (cube) for this pixel
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = depth;

                    const baseIdx = vertices.length;

                    // 8 vertices of the cube
                    vertices.push([x0, y0, z0]); // 0
                    vertices.push([x1, y0, z0]); // 1
                    vertices.push([x1, y1, z0]); // 2
                    vertices.push([x0, y1, z0]); // 3
                    vertices.push([x0, y0, z1]); // 4
                    vertices.push([x1, y0, z1]); // 5
                    vertices.push([x1, y1, z1]); // 6
                    vertices.push([x0, y1, z1]); // 7

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face (z=depth)
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face (y=y0)
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face (y=y1)
                    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6]);
                    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2]);
                    // Left face (x=x0)
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right face (x=x1)
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        // Write vertices
        vertices.forEach(([x, y, z]) => {
            xml += `          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
        });

        xml += '        </vertices>\n';
        xml += '        <triangles>\n';

        // Write triangles with color
        triangles.forEach(([v1, v2, v3]) => {
            xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" p1="${colorIndex + 1}" />\n`;
        });

        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += `      <color>${hexColor}</color>\n`;
        xml += '    </object>\n';
    });

    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all objects to the build
    partList.forEach((_, colorIndex) => {
        xml += `    <item objectid="${colorIndex + 1}" />\n`;
    });
    
    xml += '  </build>\n';
    xml += '</model>\n';

    // Create and download the file
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.filename}.3mf`;
    a.click();
    URL.revokeObjectURL(url);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const depth = settings.depth;

    const zip = new JSZip();

    // Generate one image per color
    partList.forEach((part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${colorName}_${part.symbol}.png`, base64Data, { base64: true });
    });

    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image dimensions: ${width}x${height} pixels
// Pitch: ${pitch}mm
// Depth: ${depth}mm

$fn = 50; // Circle resolution

`;

    partList.forEach((part, colorIndex) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);

        scadContent += `// ${part.target.name} (${part.count} pixels)
module layer_${colorName}_${part.symbol}() {
    color([${r}, ${g}, ${b}]) {
        scale([${pitch}, ${pitch}, ${depth}]) {
            surface(file = "${colorName}_${part.symbol}.png", center = false, invert = true);
        }
    }
}

`;
    });

    scadContent += `// Combine all layers
union() {
`;

    partList.forEach((part) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        scadContent += `    layer_${colorName}_${part.symbol}();\n`;
    });

    scadContent += `}\n`;

    zip.file('model.scad', scadContent);

    // Generate and download zip file
    zip.generateAsync({ type: 'blob' }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${settings.filename}_openscad.zip`;
        a.click();
        URL.revokeObjectURL(url);
    });
}
