import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await make3MF(image, settings.filename);
    } else {
        await makeOpenSCADMasks(image, settings.filename);
    }
}

async function make3MF(image: PartListImage, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    // Build 3MF XML content
    const materials: string[] = [];
    const meshes: string[] = [];
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).replace("#", "");
        materials.push(
            `    <basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`
        );
    });
    
    // Build triangular mesh for each color
    image.partList.forEach((part, materialId) => {
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialId) {
                    // Create a cube for this pixel (voxel)
                    const baseIdx = vertices.length;
                    
                    // Bottom vertices (z=0)
                    vertices.push(
                        { x, y, z: 0 },
                        { x: x + 1, y, z: 0 },
                        { x: x + 1, y: y + 1, z: 0 },
                        { x, y: y + 1, z: 0 }
                    );
                    
                    // Top vertices (z=1)
                    vertices.push(
                        { x, y, z: 1 },
                        { x: x + 1, y, z: 1 },
                        { x: x + 1, y: y + 1, z: 1 },
                        { x, y: y + 1, z: 1 }
                    );
                    
                    // Build 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    
                    // Left face
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length === 0) return;
        
        // Build mesh XML
        let meshXml = `    <mesh>\n`;
        meshXml += `      <vertices>\n`;
        vertices.forEach(v => {
            meshXml += `        <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
        });
        meshXml += `      </vertices>\n`;
        meshXml += `      <triangles>\n`;
        triangles.forEach(t => {
            meshXml += `        <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="${materialId}" />\n`;
        });
        meshXml += `      </triangles>\n`;
        meshXml += `    </mesh>\n`;
        
        meshes.push(meshXml);
    });
    
    // Construct the full 3MF file
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Title">${escapeXml(filename)}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join("\n")}
    </basematerials:basematerials>
    ${meshes.map((mesh, idx) => `<object id="${idx + 2}" type="model" pid="1">\n${mesh}    </object>`).join("\n    ")}
  </resources>
  <build>
    ${meshes.map((_, idx) => `<item objectid="${idx + 2}" />`).join("\n    ")}
  </build>
</model>`;
    
    const blob = new Blob([content], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

async function makeOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    // Load JSZip from CDN dynamically
    const JSZip = await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate one monochrome image per color
    const imagePromises = image.partList.map(async (part, idx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return new Promise<{ name: string; blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                resolve({
                    name: `mask_${idx}_${sanitizeFilename(part.target.name)}.png`,
                    blob: blob!
                });
            });
        });
    });
    
    const images = await Promise.all(imagePromises);
    
    // Add images to zip
    images.forEach(img => {
        zip.file(img.name, img.blob);
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Heightmap-based 3D display

module color_layer(image_file, color, height) {
    color(color)
    translate([0, 0, height])
    surface(file=image_file, invert=true, center=true);
}

`;
    
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const imageName = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        
        scadContent += `color_layer("${imageName}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}], ${idx});\n`;
    });
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}

async function loadJSZip(): Promise<any> {
    // Check if JSZip is already loaded
    if ((window as any).JSZip) {
        return (window as any).JSZip;
    }
    
    // Load JSZip from CDN
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = () => {
            reject(new Error("Failed to load JSZip"));
        };
        document.head.appendChild(script);
    });
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, "_");
}
