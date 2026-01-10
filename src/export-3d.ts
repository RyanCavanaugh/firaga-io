import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type Export3DSettings = {
    format: "3mf" | "openscad";
    layerHeight: number; // height of each pixel layer in mm
    baseHeight: number; // height of base layer in mm
    pixelSize: number; // size of each pixel in mm
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create 3MF structure
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    const model = generate3DModel(image, settings);
    
    zip.folder("_rels").file(".rels", rels);
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("3D").file("3dmodel.model", model);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

function generate3DModel(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelSize, layerHeight, baseHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Define materials for each color
    partList.forEach((part, idx) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `\n      <base name="${escapeXml(color.name)}" displaycolor="#${hexColor}" />`;
    });
    
    xml += `\n    </basematerials>`;
    
    // Create mesh objects for each color
    partList.forEach((part, partIndex) => {
        const meshData = generateColorMesh(pixels, width, height, partIndex, pixelSize, layerHeight, baseHeight);
        if (meshData.vertices.length > 0) {
            xml += `\n    <object id="${partIndex + 2}" type="model">
      <mesh>
        <vertices>`;
            
            meshData.vertices.forEach(v => {
                xml += `\n          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`;
            });
            
            xml += `\n        </vertices>
        <triangles>`;
            
            meshData.triangles.forEach(t => {
                xml += `\n          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${partIndex}" />`;
            });
            
            xml += `\n        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `\n  </resources>
  <build>`;
    
    // Add all objects to build
    partList.forEach((part, partIndex) => {
        xml += `\n    <item objectid="${partIndex + 2}" />`;
    });
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };

function generateColorMesh(
    pixels: ReadonlyArray<ReadonlyArray<number>>,
    width: number,
    height: number,
    colorIndex: number,
    pixelSize: number,
    layerHeight: number,
    baseHeight: number
): { vertices: Vertex[]; triangles: Triangle[] } {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    const vertexMap = new Map<string, number>();
    
    const getOrCreateVertex = (x: number, y: number, z: number): number => {
        const key = `${x},${y},${z}`;
        if (vertexMap.has(key)) {
            return vertexMap.get(key)!;
        }
        const index = vertices.length;
        vertices.push({ x, y, z });
        vertexMap.set(key, index);
        return index;
    };
    
    const addQuad = (v1: number, v2: number, v3: number, v4: number) => {
        triangles.push({ v1, v2, v3 });
        triangles.push({ v1: v1, v2: v3, v3: v4 });
    };
    
    // Generate mesh for each pixel of this color
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            if (pixels[py][px] === colorIndex) {
                const x0 = px * pixelSize;
                const x1 = (px + 1) * pixelSize;
                const y0 = py * pixelSize;
                const y1 = (py + 1) * pixelSize;
                const z0 = baseHeight;
                const z1 = baseHeight + layerHeight;
                
                // Create a box for this pixel
                // Bottom face
                const v0 = getOrCreateVertex(x0, y0, z0);
                const v1 = getOrCreateVertex(x1, y0, z0);
                const v2 = getOrCreateVertex(x1, y1, z0);
                const v3 = getOrCreateVertex(x0, y1, z0);
                
                // Top face
                const v4 = getOrCreateVertex(x0, y0, z1);
                const v5 = getOrCreateVertex(x1, y0, z1);
                const v6 = getOrCreateVertex(x1, y1, z1);
                const v7 = getOrCreateVertex(x0, y1, z1);
                
                // Top face (visible)
                addQuad(v4, v5, v6, v7);
                
                // Bottom face
                addQuad(v3, v2, v1, v0);
                
                // Front face
                addQuad(v0, v1, v5, v4);
                
                // Right face
                addQuad(v1, v2, v6, v5);
                
                // Back face
                addQuad(v2, v3, v7, v6);
                
                // Left face
                addQuad(v3, v0, v4, v7);
            }
        }
    }
    
    return { vertices, triangles };
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    await loadJSZip();
    
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    const { pixelSize, layerHeight, baseHeight } = settings;
    
    // Generate one monochrome image per color
    const imagePromises = partList.map(async (part, partIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return new Promise<{ name: string; blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
                resolve({ name: filename, blob: blob! });
            });
        });
    });
    
    const images = await Promise.all(imagePromises);
    
    // Add images to zip
    images.forEach(img => {
        zip.file(img.name, img.blob);
    });
    
    // Generate OpenSCAD file
    let scadCode = `// Generated OpenSCAD file for 3D display
// Image size: ${width} x ${height}
// Pixel size: ${pixelSize}mm
// Layer height: ${layerHeight}mm
// Base height: ${baseHeight}mm

pixel_size = ${pixelSize};
layer_height = ${layerHeight};
base_height = ${baseHeight};
image_width = ${width};
image_height = ${height};

`;
    
    // Add color module for each part
    partList.forEach((part, partIndex) => {
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        const imageName = images[partIndex].name;
        
        scadCode += `
// ${part.target.name}
module color_${partIndex}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]) {
        surface(file = "${imageName}", center = true, invert = true);
        scale([pixel_size, pixel_size, layer_height]) {
            translate([image_width/2, image_height/2, base_height/layer_height]) {
                surface(file = "${imageName}", center = true, invert = true);
            }
        }
    }
}
`;
    });
    
    // Add union of all colors
    scadCode += `\n// Combine all colors\nunion() {\n`;
    partList.forEach((part, partIndex) => {
        scadCode += `    color_${partIndex}();\n`;
    });
    scadCode += `}\n`;
    
    zip.file("model.scad", scadCode);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_model.zip");
}

function escapeXml(str: string): string {
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

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
