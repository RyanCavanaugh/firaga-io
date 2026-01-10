import { PartListImage } from "./image-utils";
import JSZip from "jszip";

export interface Export3DSettings {
    format: "3mf" | "openscad-masks";
    height: number; // Height in mm for the 3D extrusion
    baseThickness: number; // Base layer thickness in mm
}

/**
 * Generate a 3MF file containing a triangle mesh with separate material shapes for each color
 */
export async function generate3MF(image: PartListImage, settings: Export3DSettings): Promise<Blob> {
    const pitch = 2.5; // mm per pixel - using standard mini bead pitch
    const width = image.width * pitch;
    const depth = image.height * pitch;
    const height = settings.height;
    const baseThickness = settings.baseThickness;

    // Build 3MF XML structure
    const model = build3MFModel(image, pitch, height, baseThickness);
    
    // Create 3MF package (ZIP with specific structure)
    const zip = new JSZip();
    
    // Add required 3MF files
    zip.file("[Content_Types].xml", getContentTypesXML());
    zip.file("_rels/.rels", getRelsXML());
    zip.file("3D/3dmodel.model", model);
    
    return zip.generateAsync({ type: "blob" });
}

/**
 * Generate OpenSCAD masks format - a zip file with monochrome images and .scad file
 */
export async function generateOpenSCADMasks(image: PartListImage, settings: Export3DSettings): Promise<Blob> {
    const zip = new JSZip();
    const pitch = 2.5; // mm per pixel
    
    // Generate one monochrome image per color
    const imagePromises = image.partList.map(async (part, index) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Fill with black/white based on whether pixel matches this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === index;
                const value = isThisColor ? 255 : 0;
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob
        return new Promise<{ name: string; blob: Blob; part: typeof part }>((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) throw new Error("Failed to create blob");
                resolve({
                    name: `color_${index}_${sanitizeFilename(part.target.name)}.png`,
                    blob,
                    part
                });
            }, "image/png");
        });
    });
    
    const images = await Promise.all(imagePromises);
    
    // Add images to zip
    for (const img of images) {
        zip.file(img.name, img.blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(images, image, pitch, settings);
    zip.file("model.scad", scadContent);
    
    return zip.generateAsync({ type: "blob" });
}

function build3MFModel(image: PartListImage, pitch: number, height: number, baseThickness: number): string {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Define materials (colors)
    image.partList.forEach((part, index) => {
        const color = part.target;
        materials.push(
            `    <basematerials:base name="${escapeXML(color.name)}" ` +
            `displaycolor="#${rgbToHex(color.r, color.g, color.b)}" />`
        );
    });
    
    // Generate mesh for each color
    image.partList.forEach((part, index) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Collect all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === index) {
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // Add 8 vertices for cube
                    const v0 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    const v1 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    const v2 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    const v3 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    const v4 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    const v5 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    const v6 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    const v7 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // Add 12 triangles for cube (2 per face)
                    // Bottom face
                    triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${v3}" v2="${v0}" v3="${v4}" />`);
                    triangles.push(`      <triangle v1="${v3}" v2="${v4}" v3="${v7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${index + 1}" type="model" pid="1" pindex="${index}">
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
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Title">Pixel Art 3D Model</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;
}

function generateOpenSCADFile(
    images: Array<{ name: string; part: { target: { name: string; r: number; g: number; b: number } } }>,
    image: PartListImage,
    pitch: number,
    settings: Export3DSettings
): string {
    const width = image.width * pitch;
    const depth = image.height * pitch;
    const height = settings.height;
    
    const layers = images.map((img, index) => {
        const color = img.part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        return `// ${color.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([${pitch}, ${pitch}, ${height}])
    surface(file = "${img.name}", center = true, invert = false);`;
    });
    
    return `// Generated by firaga.io
// Pixel art 3D model from heightmaps

$fn = 20;

${layers.join('\n\n')}
`;
}

function getContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`;
}

function rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
