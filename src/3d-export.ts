import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3DFormat = "3mf" | "openscad-masks";

export interface Export3DSettings {
    format: Export3DFormat;
    pixelHeight: number;
    pixelSize: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    if (settings.format === "3mf") {
        await export3MF(image, settings, filename);
    } else {
        await exportOpenSCADMasks(image, settings, filename);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    const { pixels, width, height, partList } = image;
    const { pixelHeight, pixelSize } = settings;

    // Build triangles for each color
    const colorMeshes: Map<number, Triangle[]> = new Map();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = pixels[y][x];
            if (colorIndex === -1) continue;

            if (!colorMeshes.has(colorIndex)) {
                colorMeshes.set(colorIndex, []);
            }

            const triangles = colorMeshes.get(colorIndex)!;
            const x0 = x * pixelSize;
            const y0 = y * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y1 = (y + 1) * pixelSize;
            const z0 = 0;
            const z1 = pixelHeight;

            // Create a box (12 triangles, 2 per face)
            // Bottom face
            triangles.push(
                { v1: [x0, y0, z0], v2: [x1, y0, z0], v3: [x1, y1, z0] },
                { v1: [x0, y0, z0], v2: [x1, y1, z0], v3: [x0, y1, z0] }
            );
            // Top face
            triangles.push(
                { v1: [x0, y0, z1], v2: [x1, y1, z1], v3: [x1, y0, z1] },
                { v1: [x0, y0, z1], v2: [x0, y1, z1], v3: [x1, y1, z1] }
            );
            // Front face
            triangles.push(
                { v1: [x0, y0, z0], v2: [x1, y0, z0], v3: [x1, y0, z1] },
                { v1: [x0, y0, z0], v2: [x1, y0, z1], v3: [x0, y0, z1] }
            );
            // Back face
            triangles.push(
                { v1: [x0, y1, z0], v2: [x1, y1, z1], v3: [x1, y1, z0] },
                { v1: [x0, y1, z0], v2: [x0, y1, z1], v3: [x1, y1, z1] }
            );
            // Left face
            triangles.push(
                { v1: [x0, y0, z0], v2: [x0, y0, z1], v3: [x0, y1, z1] },
                { v1: [x0, y0, z0], v2: [x0, y1, z1], v3: [x0, y1, z0] }
            );
            // Right face
            triangles.push(
                { v1: [x1, y0, z0], v2: [x1, y1, z1], v3: [x1, y0, z1] },
                { v1: [x1, y0, z0], v2: [x1, y1, z0], v3: [x1, y1, z1] }
            );
        }
    }

    // Generate 3MF XML
    const xml = generate3MFContent(colorMeshes, partList, width, height);
    
    // Create a zip file containing the 3MF
    await downloadAs3MFZip(xml, filename);
}

type Triangle = {
    v1: [number, number, number];
    v2: [number, number, number];
    v3: [number, number, number];
};

function generate3MFContent(colorMeshes: Map<number, Triangle[]>, partList: PartListImage["partList"], width: number, height: number): string {
    let objectsXml = "";
    let componentsXml = "";
    let objectId = 1;

    // Create an object for each color
    for (const [colorIndex, triangles] of colorMeshes.entries()) {
        const color = partList[colorIndex].target;
        const hexColor = colorEntryToHex(color).slice(1); // Remove # prefix
        
        let verticesXml = "";
        let trianglesXml = "";
        
        const vertices: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        for (const triangle of triangles) {
            const indices: number[] = [];
            for (const vertex of [triangle.v1, triangle.v2, triangle.v3]) {
                const key = vertex.join(",");
                let index = vertexMap.get(key);
                if (index === undefined) {
                    index = vertices.length;
                    vertices.push(vertex);
                    vertexMap.set(key, index);
                }
                indices.push(index);
            }
            trianglesXml += `    <triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}" />\n`;
        }
        
        for (const [x, y, z] of vertices) {
            verticesXml += `    <vertex x="${x}" y="${y}" z="${z}" />\n`;
        }
        
        objectsXml += `  <object id="${objectId}" type="model">
   <mesh>
    <vertices>
${verticesXml}    </vertices>
    <triangles>
${trianglesXml}    </triangles>
   </mesh>
  </object>
`;
        componentsXml += `   <component objectid="${objectId}" />\n`;
        objectId++;
    }

    const buildItemId = objectId;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
${objectsXml}  <object id="${buildItemId}" type="model">
   <components>
${componentsXml}   </components>
  </object>
 </resources>
 <build>
  <item objectid="${buildItemId}" />
 </build>
</model>`;
}

async function downloadAs3MFZip(modelXml: string, filename: string): Promise<void> {
    // 3MF files are ZIP archives with specific structure
    const { default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm" as any);
    
    const zip = new JSZip();
    
    // Required files for 3MF format
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`);
    
    zip.folder("3D")!.file("3dmodel.model", modelXml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
}

async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    const { pixels, width, height, partList } = image;
    const { pixelHeight, pixelSize } = settings;

    const { default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm" as any);
    const zip = new JSZip();

    // Create one mask image per color
    const colorImages: Array<{ name: string; canvas: HTMLCanvasElement; color: string }> = [];

    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white (background)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = "black";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const color = partList[colorIndex];
        const colorName = color.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const colorHex = colorEntryToHex(color.target);
        
        colorImages.push({
            name: `mask_${colorIndex}_${colorName}.png`,
            canvas,
            color: colorHex
        });
    }

    // Save all mask images to zip
    for (const { name, canvas } of colorImages) {
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        zip.file(name, blob);
    }

    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel-based 3D visualization

pixel_size = ${pixelSize};
pixel_height = ${pixelHeight};
image_width = ${width};
image_height = ${height};

`;

    for (let i = 0; i < colorImages.length; i++) {
        const { name, color } = colorImages[i];
        const rgb = hexToRgb(color);
        scadContent += `
module color_${i}() {
    color([${rgb[0] / 255}, ${rgb[1] / 255}, ${rgb[2] / 255}])
    surface(file = "${name}", center = true, invert = true);
}
`;
    }

    scadContent += `
// Combine all colors
union() {
`;

    for (let i = 0; i < colorImages.length; i++) {
        scadContent += `    scale([pixel_size, pixel_size, pixel_height]) color_${i}();\n`;
    }

    scadContent += `}
`;

    zip.file(`${filename}.scad`, scadContent);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
