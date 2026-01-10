import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const content = generate3MFContent(image, settings);
    const blob = new Blob([content], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, baseHeight } = settings;
    let meshId = 1;
    const meshes: string[] = [];
    const buildItems: string[] = [];
    const materials: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target);
        const rgb = hexToRgb(color);
        materials.push(
            `    <base:material name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />`
        );
    });
    
    // Create a mesh for each color
    image.partList.forEach((part, materialIdx) => {
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: number[] = [];
        const vertexMap = new Map<string, number>();
        
        function addVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            if (vertexMap.has(key)) {
                return vertexMap.get(key)!;
            }
            const idx = vertices.length;
            vertices.push({ x, y, z });
            vertexMap.set(key, idx);
            return idx;
        }
        
        function addQuad(
            x0: number, y0: number, z0: number,
            x1: number, y1: number, z1: number,
            x2: number, y2: number, z2: number,
            x3: number, y3: number, z3: number
        ): void {
            const v0 = addVertex(x0, y0, z0);
            const v1 = addVertex(x1, y1, z1);
            const v2 = addVertex(x2, y2, z2);
            const v3 = addVertex(x3, y3, z3);
            
            // Two triangles for a quad
            triangles.push(v0, v1, v2);
            triangles.push(v0, v2, v3);
        }
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] !== materialIdx) continue;
                
                const x0 = x;
                const x1 = x + 1;
                const y0 = y;
                const y1 = y + 1;
                const z0 = baseHeight;
                const z1 = baseHeight + pixelHeight;
                
                // Top face
                addQuad(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1);
                
                // Bottom face (if needed)
                if (baseHeight > 0) {
                    addQuad(x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0);
                }
                
                // Side faces (only if not adjacent to same color)
                // Left face
                if (x === 0 || image.pixels[y][x - 1] !== materialIdx) {
                    addQuad(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0);
                }
                // Right face
                if (x === image.width - 1 || image.pixels[y][x + 1] !== materialIdx) {
                    addQuad(x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1);
                }
                // Front face
                if (y === 0 || image.pixels[y - 1][x] !== materialIdx) {
                    addQuad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1);
                }
                // Back face
                if (y === image.height - 1 || image.pixels[y + 1][x] !== materialIdx) {
                    addQuad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0);
                }
            }
        }
        
        if (vertices.length === 0) return;
        
        // Generate mesh XML
        const verticesXml = vertices
            .map(v => `      <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`)
            .join("\n");
        
        const trianglesXml: string[] = [];
        for (let i = 0; i < triangles.length; i += 3) {
            trianglesXml.push(
                `      <triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" pid="1" p1="${materialIdx}" />`
            );
        }
        
        meshes.push(`  <object id="${meshId}" type="model" pid="1" pindex="${materialIdx}">
    <mesh>
    <vertices>
${verticesXml}
    </vertices>
    <triangles>
${trianglesXml.join("\n")}
    </triangles>
    </mesh>
  </object>`);
        
        buildItems.push(`    <item objectid="${meshId}" />`);
        meshId++;
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(settings.filename)}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
  <basematerials id="1">
${materials.join("\n")}
  </basematerials>
${meshes.join("\n")}
  </resources>
  <build>
${buildItems.join("\n")}
  </build>
</model>`;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import("jszip" as any)) as any;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip.default();
    
    // Generate one mask image per color
    const imagePromises = image.partList.map(async (part, idx) => {
        const maskData = generateMaskImage(image, idx);
        zip.file(`mask_${idx}_${sanitizeFilename(part.target.name)}.png`, maskData.split(",")[1], { base64: true });
        return { idx, name: part.target.name, color: colorEntryToHex(part.target) };
    });
    
    const imageInfo = await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageInfo, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${settings.filename}.zip`);
}

function generateMaskImage(image: PartListImage, colorIndex: number): string {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 0 : 255; // Black where color exists, white elsewhere
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
}

function generateOpenSCADFile(
    image: PartListImage,
    imageInfo: Array<{ idx: number; name: string; color: string }>,
    settings: ThreeDSettings
): string {
    const { pixelHeight, baseHeight } = settings;
    const width = image.width;
    const height = image.height;
    
    let scadContent = `// Generated by firaga.io
// Image: ${settings.filename}
// Size: ${width}x${height} pixels

$fn = 20;

`;
    
    // Add color definitions
    imageInfo.forEach(({ idx, name, color }) => {
        const rgb = hexToRgbArray(color);
        scadContent += `color_${idx} = [${rgb[0]}, ${rgb[1]}, ${rgb[2]}]; // ${name}\n`;
    });
    
    scadContent += `\n`;
    
    // Create heightmap module for each color
    imageInfo.forEach(({ idx, name }) => {
        const filename = `mask_${idx}_${sanitizeFilename(name)}.png`;
        scadContent += `
module layer_${idx}() {
    color(color_${idx})
    translate([0, 0, ${baseHeight}])
    scale([1, 1, ${pixelHeight}])
    surface(file = "${filename}", center = false, invert = true);
}
`;
    });
    
    scadContent += `\n// Base layer\n`;
    if (baseHeight > 0) {
        scadContent += `cube([${width}, ${height}, ${baseHeight}]);\n\n`;
    }
    
    scadContent += `// Color layers\n`;
    imageInfo.forEach(({ idx }) => {
        scadContent += `layer_${idx}();\n`;
    });
    
    return scadContent;
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "#808080";
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgbArray(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0.5, 0.5, 0.5];
    return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ];
}

function toHex(n: number): string {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
