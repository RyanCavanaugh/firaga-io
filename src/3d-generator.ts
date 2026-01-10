import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    layerHeight: number;
};

/**
 * Generate 3D output in the specified format
 */
export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad") {
        await makeOpenSCAD(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const { saveAs } = await import("file-saver");
    
    const xml = generate3MFContent(image, settings.layerHeight);
    const blob = new Blob([xml], { type: "application/xml" });
    
    saveAs(blob, `${settings.filename}.3mf`);
}

/**
 * Generate OpenSCAD masks - a ZIP file with monochrome images and .scad file
 */
async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();
    
    // Generate one black/white PNG for each color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const pngData = await generateMaskImage(image, i);
        zip.file(`mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`, pngData);
    }
    
    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings.layerHeight);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${settings.filename}_openscad.zip`);
}

/**
 * Generate a monochrome PNG for a specific color layer
 */
async function generateMaskImage(image: PartListImage, partIndex: number): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelPartIndex = image.pixels[y][x];
            
            // White (255) where this part should be, black (0) otherwise
            const value = pixelPartIndex === partIndex ? 255 : 0;
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255; // fully opaque
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob using promise
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob"));
            }
        }, "image/png");
    });
}

/**
 * Generate the OpenSCAD file content
 */
function generateOpenSCADFile(image: PartListImage, layerHeight: number): string {
    const lines: string[] = [];
    
    lines.push("// Generated OpenSCAD file for bead sprite");
    lines.push(`// Image size: ${image.width}x${image.height}`);
    lines.push("");
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const filename = `mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`;
        const hex = colorEntryToHex(part.target);
        
        lines.push(`// ${part.target.name} (${part.count} beads)`);
        lines.push(`color("${hex}")`);
        lines.push(`  translate([0, 0, ${i * layerHeight}])`);
        lines.push(`    surface(file = "${filename}", center = true, invert = true);`);
        lines.push("");
    }
    
    return lines.join("\n");
}

/**
 * Generate 3MF XML content
 */
function generate3MFContent(image: PartListImage, layerHeight: number): string {
    const lines: string[] = [];
    
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">');
    lines.push('  <resources>');
    
    // Define materials for each color
    lines.push('    <basematerials id="1">');
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        const name = escapeXml(part.target.name);
        lines.push(`      <base name="${name}" displaycolor="${hex}" />`);
    }
    lines.push('    </basematerials>');
    
    // Generate mesh objects for each color layer
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const mesh = generateMesh(image, i, layerHeight * i, layerHeight);
        lines.push(`    <object id="${i + 2}" type="model">`);
        lines.push(`      <mesh>`);
        lines.push(`        <vertices>`);
        
        for (const vertex of mesh.vertices) {
            lines.push(`          <vertex x="${vertex[0]}" y="${vertex[1]}" z="${vertex[2]}" />`);
        }
        
        lines.push(`        </vertices>`);
        lines.push(`        <triangles>`);
        
        for (const tri of mesh.triangles) {
            lines.push(`          <triangle v1="${tri[0]}" v2="${tri[1]}" v3="${tri[2]}" pid="1" p1="${i}" />`);
        }
        
        lines.push(`        </triangles>`);
        lines.push(`      </mesh>`);
        lines.push(`    </object>`);
    }
    
    lines.push('  </resources>');
    lines.push('  <build>');
    
    for (let i = 0; i < image.partList.length; i++) {
        lines.push(`    <item objectid="${i + 2}" />`);
    }
    
    lines.push('  </build>');
    lines.push('</model>');
    
    return lines.join("\n");
}

/**
 * Generate a triangle mesh for a specific color layer
 */
function generateMesh(image: PartListImage, partIndex: number, zOffset: number, height: number): {
    vertices: number[][];
    triangles: number[][];
} {
    const vertices: number[][] = [];
    const triangles: number[][] = [];
    
    // For each pixel of this color, create a cube
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                const baseIdx = vertices.length;
                
                // Add 8 vertices for a cube at this position
                const x0 = x;
                const x1 = x + 1;
                const y0 = y;
                const y1 = y + 1;
                const z0 = zOffset;
                const z1 = zOffset + height;
                
                // Bottom face vertices
                vertices.push([x0, y0, z0]);
                vertices.push([x1, y0, z0]);
                vertices.push([x1, y1, z0]);
                vertices.push([x0, y1, z0]);
                
                // Top face vertices
                vertices.push([x0, y0, z1]);
                vertices.push([x1, y0, z1]);
                vertices.push([x1, y1, z1]);
                vertices.push([x0, y1, z1]);
                
                // Add triangles (2 per face, 6 faces = 12 triangles)
                // Bottom face
                triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 2]);
                triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 3]);
                
                // Top face
                triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 5]);
                triangles.push([baseIdx + 4, baseIdx + 7, baseIdx + 6]);
                
                // Front face
                triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 1]);
                triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 5]);
                
                // Back face
                triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 3]);
                triangles.push([baseIdx + 2, baseIdx + 6, baseIdx + 7]);
                
                // Left face
                triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 7]);
                triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 4]);
                
                // Right face
                triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 2]);
                triangles.push([baseIdx + 1, baseIdx + 5, baseIdx + 6]);
            }
        }
    }
    
    return { vertices, triangles };
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
