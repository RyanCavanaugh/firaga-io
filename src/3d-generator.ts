import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "model.3mf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        xml += `      <base name="${color.name}" displaycolor="#${hex}" />\n`;
    }

    xml += `    </basematerials>\n`;

    // Generate mesh for each color
    let objectId = 2;
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        xml += generateMeshForColor(image, partIndex, objectId, settings);
        objectId++;
    }

    xml += `  </resources>
  <build>
`;

    // Add all objects to build
    objectId = 2;
    for (let i = 0; i < image.partList.length; i++) {
        xml += `    <item objectid="${objectId}" />\n`;
        objectId++;
    }

    xml += `  </build>
</model>`;

    return xml;
}

function generateMeshForColor(image: PartListImage, partIndex: number, objectId: number, settings: ThreeDSettings): string {
    const vertices: Array<[number, number, number]> = [];
    const triangles: Array<[number, number, number]> = [];
    const vertexMap = new Map<string, number>();

    function getOrAddVertex(x: number, y: number, z: number): number {
        const key = `${x},${y},${z}`;
        let index = vertexMap.get(key);
        if (index === undefined) {
            index = vertices.length;
            vertices.push([x, y, z]);
            vertexMap.set(key, index);
        }
        return index;
    }

    // Create a heightmap for this color
    const baseZ = 0;
    const topZ = settings.baseHeight + settings.pixelHeight;

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                // Create a box for this pixel
                const x0 = x;
                const x1 = x + 1;
                const y0 = y;
                const y1 = y + 1;

                // Bottom face (z = baseZ)
                const v0 = getOrAddVertex(x0, y0, baseZ);
                const v1 = getOrAddVertex(x1, y0, baseZ);
                const v2 = getOrAddVertex(x1, y1, baseZ);
                const v3 = getOrAddVertex(x0, y1, baseZ);

                // Top face (z = topZ)
                const v4 = getOrAddVertex(x0, y0, topZ);
                const v5 = getOrAddVertex(x1, y0, topZ);
                const v6 = getOrAddVertex(x1, y1, topZ);
                const v7 = getOrAddVertex(x0, y1, topZ);

                // Bottom face (2 triangles)
                triangles.push([v0, v2, v1]);
                triangles.push([v0, v3, v2]);

                // Top face (2 triangles)
                triangles.push([v4, v5, v6]);
                triangles.push([v4, v6, v7]);

                // Side faces
                // Front
                triangles.push([v0, v1, v5]);
                triangles.push([v0, v5, v4]);

                // Right
                triangles.push([v1, v2, v6]);
                triangles.push([v1, v6, v5]);

                // Back
                triangles.push([v2, v3, v7]);
                triangles.push([v2, v7, v6]);

                // Left
                triangles.push([v3, v0, v4]);
                triangles.push([v3, v4, v7]);
            }
        }
    }

    if (vertices.length === 0) {
        return "";
    }

    let xml = `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
`;

    for (const [x, y, z] of vertices) {
        xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
    }

    xml += `        </vertices>
        <triangles>
`;

    for (const [v1, v2, v3] of triangles) {
        xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${partIndex}" />\n`;
    }

    xml += `        </triangles>
      </mesh>
    </object>
`;

    return xml;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one mask image per color
    for (let i = 0; i < image.partList.length; i++) {
        const maskData = generateMaskImage(image, i);
        zip.file(`mask_${i}_${sanitizeFilename(image.partList[i].target.name)}.png`, maskData);
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);

    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "openscad-masks.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateMaskImage(image: PartListImage, partIndex: number): Blob {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;

    // Fill with white (transparent in heightmap)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw black pixels where this color appears
    ctx.fillStyle = "black";
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // Convert to blob
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob"));
            }
        }, "image/png");
    }) as any;
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    let scad = `// Generated OpenSCAD file for pixel art
// Image dimensions: ${image.width} x ${image.height}
// Base height: ${settings.baseHeight}mm
// Pixel height: ${settings.pixelHeight}mm

`;

    // Add color() and surface() commands for each mask
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        const filename = `mask_${i}_${sanitizeFilename(color.name)}.png`;

        scad += `// ${color.name}\n`;
        scad += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scad += `  translate([0, 0, ${settings.baseHeight}])\n`;
        scad += `    scale([1, 1, ${settings.pixelHeight}])\n`;
        scad += `      surface(file = "${filename}", center = true, invert = true);\n\n`;
    }

    // Add base
    scad += `// Base\n`;
    scad += `color([0.5, 0.5, 0.5])\n`;
    scad += `  translate([0, 0, ${settings.baseHeight / 2}])\n`;
    scad += `    cube([${image.width}, ${image.height}, ${settings.baseHeight}], center = true);\n`;

    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function loadJSZip(): Promise<any> {
    return new Promise((resolve) => {
        const scriptEl = document.getElementById("jszip-script");
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = "jszip-script";
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve((window as any).JSZip);
        }
    });
}
