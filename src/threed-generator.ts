import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
}

/**
 * Generates 3D output files from a PartListImage
 */
export async function makeThreeD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZipAnd(() => {
        if (settings.format === "3mf") {
            generate3MF(image, settings);
        } else {
            generateOpenSCADMasks(image, settings);
        }
    });
}

async function loadJSZipAnd(func: () => void): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}

/**
 * Generates a 3MF file (3D Manufacturing Format)
 * Creates a triangle mesh with separate material shapes for each color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    
    // Add _rels/.rels
    const relsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.folder("_rels")!.file(".rels", relsContent);
    
    // Add [Content_Types].xml
    const contentTypesContent = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file("[Content_Types].xml", contentTypesContent);
    
    // Generate 3D model
    const modelContent = generate3DModelXML(image, settings);
    zip.folder("3D")!.file("3dmodel.model", modelContent);
    
    // Generate and download
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        downloadBlob(content, `${settings.filename}.3mf`);
    });
}

/**
 * Generates the 3D model XML for the 3MF file
 */
function generate3DModelXML(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const { pitch, height: blockHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `\n      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />`;
    });
    
    xml += `\n    </basematerials>`;
    
    // Create mesh objects for each color
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const baseIdx = vertices.length;
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = blockHeight;
                    
                    // Add 8 vertices for the cube
                    vertices.push([x0, y0, z0]);
                    vertices.push([x1, y0, z0]);
                    vertices.push([x1, y1, z0]);
                    vertices.push([x0, y1, z0]);
                    vertices.push([x0, y0, z1]);
                    vertices.push([x1, y0, z1]);
                    vertices.push([x1, y1, z1]);
                    vertices.push([x0, y1, z1]);
                    
                    // Add 12 triangles (2 per face, 6 faces)
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
        
        if (vertices.length > 0) {
            xml += `\n    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>`;
            
            vertices.forEach(([x, y, z]) => {
                xml += `\n          <vertex x="${x}" y="${y}" z="${z}" />`;
            });
            
            xml += `\n        </vertices>
        <triangles>`;
            
            triangles.forEach(([v1, v2, v3]) => {
                xml += `\n          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />`;
            });
            
            xml += `\n        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `\n  </resources>
  <build>`;
    
    // Add all objects to the build
    partList.forEach((part, colorIdx) => {
        xml += `\n    <item objectid="${colorIdx + 2}" />`;
    });
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

/**
 * Generates OpenSCAD masks format
 * Creates a ZIP with one B/W image per color and a .scad file
 */
function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    
    // Create a canvas for generating mask images
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    
    const maskFilenames: string[] = [];
    
    // Generate one mask image per color
    partList.forEach((part, colorIdx) => {
        // Clear canvas to white
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = "#000000";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG and add to zip
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        maskFilenames.push(filename);
        zip.file(filename, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings, maskFilenames);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        downloadBlob(content, `${settings.filename}_openscad.zip`);
    });
}

/**
 * Generates the OpenSCAD file content
 */
function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings, maskFilenames: string[]): string {
    const { width, height, partList } = image;
    const { pitch, height: blockHeight } = settings;
    
    let scad = `// Generated by firaga.io
// Image size: ${width}x${height}
// Pitch: ${pitch}mm

`;
    
    // Add module for each color layer
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        const [r, g, b] = [
            parseInt(hex.substring(0, 2), 16) / 255,
            parseInt(hex.substring(2, 4), 16) / 255,
            parseInt(hex.substring(4, 6), 16) / 255
        ];
        
        scad += `// ${part.target.name}
module layer_${idx}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    scale([${pitch}, ${pitch}, ${blockHeight}])
    surface(file = "${maskFilenames[idx]}", center = false, invert = true);
}

`;
    });
    
    // Combine all layers
    scad += `// Combine all layers
union() {
`;
    
    partList.forEach((part, idx) => {
        scad += `    layer_${idx}();\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
