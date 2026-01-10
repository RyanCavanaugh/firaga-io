import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3DSettings = {
    format: "3mf" | "openscad";
    height: number;
    baseHeight: number;
    filename: string;
};

declare const JSZip: any;

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
    downloadFile(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { width, height: imgHeight, partList, pixels } = image;
    const { height: pixelHeight, baseHeight } = settings;

    // Build color materials
    const materials = partList.map((entry, idx) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove #
        return `    <basematerials:base name="${entry.target.name}" displaycolor="#${color}FF" />`;
    }).join("\n");

    const meshes: string[] = [];
    let nextObjectId = 2;

    // Create a mesh for each color
    partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < imgHeight; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a box at position (x, y) with the specified height
                    const baseIdx = vertexCount;
                    
                    // Bottom vertices (z = 0)
                    vertices.push(`      <vertex x="${x}" y="${y}" z="${baseHeight}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="${baseHeight}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="${baseHeight}" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="${baseHeight}" />`);
                    
                    // Top vertices (z = height)
                    const topZ = baseHeight + pixelHeight;
                    vertices.push(`      <vertex x="${x}" y="${y}" z="${topZ}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="${topZ}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="${topZ}" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="${topZ}" />`);

                    // Create triangles for the box (12 triangles, 2 per face)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    
                    // Front face (y = 0)
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    
                    // Back face (y = 1)
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    
                    // Left face (x = 0)
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    
                    // Right face (x = 1)
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const objectId = nextObjectId++;
            meshes.push(`  <object id="${objectId}" type="model" pid="1" pindex="${colorIdx}">
    <mesh>
    <vertices>
${vertices.join("\n")}
    </vertices>
    <triangles>
${triangles.join("\n")}
    </triangles>
    </mesh>
  </object>`);
        }
    });

    const buildItems = meshes.map((_, idx) => `    <item objectid="${idx + 2}" />`).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materials}
    </basematerials:basematerials>
${meshes.join("\n")}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    // Load JSZip dynamically
    await loadJSZip();
    
    const zip = new JSZip();
    const { partList, pixels, width, height: imgHeight } = image;

    // Create one black/white image per color
    partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = imgHeight;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, imgHeight);
        
        // Draw black pixels for this color
        ctx.fillStyle = "#000000";
        for (let y = 0; y < imgHeight; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG and add to zip
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        zip.file(`color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`, base64Data, { base64: true });
    });

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    downloadFile(blob, `${settings.filename}_openscad.zip`);
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { partList, width, height: imgHeight } = image;
    const { height: pixelHeight, baseHeight } = settings;

    const modules: string[] = [];
    
    partList.forEach((entry, colorIdx) => {
        const filename = `color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        const hexColor = colorEntryToHex(entry.target);
        
        modules.push(`// ${entry.target.name}
module color_${colorIdx}() {
    color("${hexColor}")
    translate([0, 0, ${baseHeight}])
    surface(file = "${filename}", center = true, invert = true);
}`);
    });

    const calls = partList.map((_, idx) => `color_${idx}();`).join("\n");

    return `// Generated by firaga.io
// Image dimensions: ${width} x ${imgHeight}
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

$fn = 30;

${modules.join("\n\n")}

// Render all colors
${calls}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
