import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3DFormat = "3mf" | "openscad";

export type Export3DSettings = {
    format: Export3DFormat;
    pixelHeight: number;
    baseHeight: number;
};

export async function export3D(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    if (settings.format === "3mf") {
        await export3MF(image, settings, filename);
    } else {
        await exportOpenSCAD(image, settings, filename);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { pixelHeight, baseHeight } = settings;
    let vertexId = 0;
    const vertices: string[] = [];
    const triangles: string[] = [];
    const resources: string[] = [];
    
    // Create material for each color
    const materials = image.partList.map((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        return `    <basematerials id="${idx + 1}">
      <base name="${part.target.name}" displaycolor="#${hex}" />
    </basematerials>`;
    });
    
    resources.push(...materials);
    
    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        const startVertexId = vertexId;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const box = createBox(x, y, pixelHeight, baseHeight, vertexId);
                    colorVertices.push(...box.vertices);
                    colorTriangles.push(...box.triangles);
                    vertexId += 8;
                }
            }
        }
        
        if (colorVertices.length > 0) {
            resources.push(`    <object id="${100 + colorIdx}" type="model">
      <mesh>
        <vertices>
${colorVertices.join('\n')}
        </vertices>
        <triangles>
${colorTriangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    });
    
    // Build components
    const components = image.partList
        .map((_, idx) => `      <component objectid="${100 + idx}" />`)
        .join('\n');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
    <object id="1" type="model">
      <components>
${components}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
    
    return xml;
}

function createBox(x: number, y: number, height: number, baseHeight: number, startId: number): { vertices: string[], triangles: string[] } {
    const z0 = 0;
    const z1 = baseHeight;
    const z2 = baseHeight + height;
    
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    
    // 8 vertices of the box
    const vertices = [
        `          <vertex x="${x0}" y="${y0}" z="${z0}" />`, // 0
        `          <vertex x="${x1}" y="${y0}" z="${z0}" />`, // 1
        `          <vertex x="${x1}" y="${y1}" z="${z0}" />`, // 2
        `          <vertex x="${x0}" y="${y1}" z="${z0}" />`, // 3
        `          <vertex x="${x0}" y="${y0}" z="${z2}" />`, // 4
        `          <vertex x="${x1}" y="${y0}" z="${z2}" />`, // 5
        `          <vertex x="${x1}" y="${y1}" z="${z2}" />`, // 6
        `          <vertex x="${x0}" y="${y1}" z="${z2}" />`, // 7
    ];
    
    // 12 triangles (2 per face, 6 faces)
    const v0 = startId;
    const triangles = [
        // Bottom
        `          <triangle v1="${v0 + 0}" v2="${v0 + 2}" v3="${v0 + 1}" />`,
        `          <triangle v1="${v0 + 0}" v2="${v0 + 3}" v3="${v0 + 2}" />`,
        // Top
        `          <triangle v1="${v0 + 4}" v2="${v0 + 5}" v3="${v0 + 6}" />`,
        `          <triangle v1="${v0 + 4}" v2="${v0 + 6}" v3="${v0 + 7}" />`,
        // Front
        `          <triangle v1="${v0 + 0}" v2="${v0 + 1}" v3="${v0 + 5}" />`,
        `          <triangle v1="${v0 + 0}" v2="${v0 + 5}" v3="${v0 + 4}" />`,
        // Back
        `          <triangle v1="${v0 + 2}" v2="${v0 + 3}" v3="${v0 + 7}" />`,
        `          <triangle v1="${v0 + 2}" v2="${v0 + 7}" v3="${v0 + 6}" />`,
        // Left
        `          <triangle v1="${v0 + 3}" v2="${v0 + 0}" v3="${v0 + 4}" />`,
        `          <triangle v1="${v0 + 3}" v2="${v0 + 4}" v3="${v0 + 7}" />`,
        // Right
        `          <triangle v1="${v0 + 1}" v2="${v0 + 2}" v3="${v0 + 6}" />`,
        `          <triangle v1="${v0 + 1}" v2="${v0 + 6}" v3="${v0 + 5}" />`,
    ];
    
    return { vertices, triangles };
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();
    
    // Generate one monochrome image per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const pngData = generateMonochromeImage(image, i);
        zip.file(`color_${i}_${sanitizeFilename(part.target.name)}.png`, pngData);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename}_openscad.zip`);
}

function generateMonochromeImage(image: PartListImage, colorIndex: number): Blob {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 0 : 255; // Black for this color, white for others
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob synchronously using a temporary approach
    const dataURL = canvas.toDataURL("image/png");
    const base64 = dataURL.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: "image/png" });
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { pixelHeight, baseHeight } = settings;
    
    let scadContent = `// Generated by firaga.io
// Image dimensions: ${image.width}x${image.height}
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

pixel_size = 1;  // Each pixel is 1x1 mm in XY
pixel_height = ${pixelHeight};
base_height = ${baseHeight};
image_width = ${image.width};
image_height = ${image.height};

module color_layer(image_file, color) {
    color(color)
    surface(file = image_file, invert = true, center = false);
}

union() {
    // Base layer
    translate([0, 0, 0])
    cube([image_width, image_height, base_height]);
    
`;
    
    // Add each color layer
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const filename = `color_${idx}_${sanitizeFilename(part.target.name)}.png`;
        scadContent += `    // ${part.target.name}
    translate([0, 0, base_height])
    color_layer("${filename}", "${hex}");
    
`;
    });
    
    scadContent += `}\n`;
    
    return scadContent;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
