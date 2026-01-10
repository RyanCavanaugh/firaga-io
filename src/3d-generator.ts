import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
    gridSize: string;
    filename: string;
}

/**
 * Generate 3D output in the specified format
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;

    // Build 3MF XML structure
    let meshId = 1;
    const meshes: string[] = [];
    const buildItems: string[] = [];
    const materials: string[] = [];

    // Create materials for each color
    partList.forEach((part, index) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove '#'
        materials.push(
            `    <basematerials id="${index + 1}">` +
            `<base name="${color.name}" displaycolor="#${hex}" />` +
            `</basematerials>`
        );
    });

    // Generate mesh for each color
    partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();

        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    addBox(x, y, vertices, triangles, vertexMap);
                }
            }
        }

        if (vertices.length > 0) {
            // Build vertex and triangle XML
            const verticesXML = vertices
                .map(([x, y, z]) => `        <vertex x="${x}" y="${y}" z="${z}" />`)
                .join("\n");

            const trianglesXML = triangles
                .map(([v1, v2, v3]) => `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`)
                .join("\n");

            meshes.push(
                `  <mesh>\n` +
                `    <vertices>\n${verticesXML}\n    </vertices>\n` +
                `    <triangles>\n${trianglesXML}\n    </triangles>\n` +
                `  </mesh>`
            );

            buildItems.push(
                `    <item objectid="${meshId}" />`
            );

            meshId++;
        }

        function addBox(
            px: number,
            py: number,
            verts: Array<[number, number, number]>,
            tris: Array<[number, number, number]>,
            vmap: Map<string, number>
        ): void {
            const x0 = px;
            const x1 = px + 1;
            const y0 = py;
            const y1 = py + 1;
            const z0 = 0;
            const z1 = baseHeight + pixelHeight;

            // 8 vertices of the box
            const boxVerts: Array<[number, number, number]> = [
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], // top
            ];

            const indices = boxVerts.map((v) => {
                const key = `${v[0]},${v[1]},${v[2]}`;
                let idx = vmap.get(key);
                if (idx === undefined) {
                    idx = verts.length;
                    verts.push(v);
                    vmap.set(key, idx);
                }
                return idx;
            });

            // 12 triangles (2 per face, 6 faces)
            const faces = [
                [0, 1, 2], [0, 2, 3], // bottom
                [4, 6, 5], [4, 7, 6], // top
                [0, 4, 5], [0, 5, 1], // front
                [1, 5, 6], [1, 6, 2], // right
                [2, 6, 7], [2, 7, 3], // back
                [3, 7, 4], [3, 4, 0], // left
            ];

            faces.forEach(([a, b, c]) => {
                tris.push([indices[a], indices[b], indices[c]]);
            });
        }
    });

    // Build complete 3MF XML
    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${settings.filename}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
${materials.join("\n")}
${meshes.map((mesh, i) => `  <object id="${i + 1}" type="model">\n${mesh}\n  </object>`).join("\n")}
  </resources>
  <build>
${buildItems.join("\n")}
  </build>
</model>`;

    // Download the file
    downloadFile(`${settings.filename}.3mf`, xml, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

/**
 * Generate OpenSCAD masks format (zip with monochrome images + .scad file)
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;

    // We'll need JSZip library - load it dynamically
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one monochrome image per color
    const scadCommands: string[] = [];

    for (let i = 0; i < partList.length; i++) {
        const part = partList[i];
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to PNG and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });

        const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);

        // Add OpenSCAD command for this layer
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;

        scadCommands.push(
            `// ${part.target.name}\n` +
            `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n` +
            `  translate([0, 0, ${baseHeight}])\n` +
            `    scale([1, 1, ${pixelHeight}])\n` +
            `      surface(file = "${filename}", center = true, invert = true);`
        );
    }

    // Create OpenSCAD file
    const scadContent =
        `// Generated by firaga.io
// Grid size: ${settings.gridSize}
// Image dimensions: ${width} x ${height}

${scadCommands.join("\n\n")}
`;

    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate and download the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadFile(`${settings.filename}.zip`, zipBlob, "application/zip");
}

/**
 * Sanitize filename for use in filesystem
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
}

/**
 * Download a file to the user's computer
 */
function downloadFile(filename: string, content: string | Blob, mimeType: string): void {
    const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Dynamically load JSZip library
 */
async function loadJSZip(): Promise<typeof import("jszip")> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const existing = document.getElementById(tagName);
        if (existing !== null) {
            resolve((window as any).JSZip);
            return;
        }

        const script = document.createElement("script");
        script.id = tagName;
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(script);
    });
}
