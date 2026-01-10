import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    layerHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const xml = build3MFContent(image, settings.layerHeight);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, layerHeight: number): string {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target).substring(1); // Remove #
        materials.push(`    <basematerials:base name="${entry.target.name}" displaycolor="#${hex}" />`);
    });
    
    // Create mesh objects for each color
    image.partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box (cube) for this pixel
                    const baseIdx = vertexCount;
                    
                    // 8 vertices of a unit cube at position (x, y, 0)
                    // Bottom face (z=0)
                    vertices.push(`      <vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="0" />`);
                    // Top face (z=layerHeight)
                    vertices.push(`      <vertex x="${x}" y="${y}" z="${layerHeight}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="${layerHeight}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="${layerHeight}" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="${layerHeight}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx}" v3="${baseIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${colorIdx + 2}" type="model" pid="1" pindex="${colorIdx}">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });
    
    const buildItems = objects.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${''}</metadata>
  <metadata name="Designer">${''}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Generate one image per color
    const imageFiles: string[] = [];
    image.partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const filename = `color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        imageFiles.push(filename);
        
        // Convert canvas to blob and add to zip
        canvas.toBlob((blob) => {
            if (blob) {
                zip.file(filename, blob);
            }
        });
    });
    
    // Generate OpenSCAD file
    const scadContent = buildOpenSCADContent(image, imageFiles, settings.layerHeight);
    zip.file("display.scad", scadContent);
    
    // Wait a bit for all blobs to be added
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${settings.filename}.zip`);
}

function buildOpenSCADContent(image: PartListImage, imageFiles: string[], layerHeight: number): string {
    const layers: string[] = [];
    
    image.partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const rgb = [
            parseInt(hex.substring(1, 3), 16) / 255,
            parseInt(hex.substring(3, 5), 16) / 255,
            parseInt(hex.substring(5, 7), 16) / 255
        ];
        
        layers.push(`  // ${entry.target.name}
  color([${rgb[0].toFixed(3)}, ${rgb[1].toFixed(3)}, ${rgb[2].toFixed(3)}])
    translate([0, 0, ${idx * layerHeight}])
      surface(file = "${imageFiles[idx]}", center = true, invert = true);`);
    });
    
    return `// Generated by firaga.io
// OpenSCAD 3D display with heightmap layers

module display() {
${layers.join('\n\n')}
}

display();
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_');
}
