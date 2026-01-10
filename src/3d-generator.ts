import { PartListImage } from "./image-utils";

declare const JSZip: typeof import("jszip");
declare const saveAs: typeof import("file-saver").saveAs;

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    height: number; // Height of each pixel/voxel in mm
    baseHeight: number; // Height of base layer in mm
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await load3DLibrariesAnd(() => generate3DWorker(image, settings));
}

async function load3DLibrariesAnd(func: () => void) {
    const zipTagName = "jszip-script-tag";
    const zipScriptEl = document.getElementById(zipTagName);
    
    if (zipScriptEl === null) {
        const tag = document.createElement("script");
        tag.id = zipTagName;
        tag.onload = () => {
            loadFileSaverAnd(func);
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        loadFileSaverAnd(func);
    }
}

function loadFileSaverAnd(func: () => void) {
    const fsTagName = "filesaver-script-tag";
    const fsScriptEl = document.getElementById(fsTagName);
    
    if (fsScriptEl === null) {
        const tag = document.createElement("script");
        tag.id = fsTagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}

async function generate3DWorker(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with separate shapes for each color
    const models: string[] = [];
    let objectId = 1;
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const vertices: [number, number, number][] = [];
        const triangles: [number, number, number][] = [];
        
        // Create voxels for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box at (x, y) with given height
                    const baseIdx = vertices.length;
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.height;
                    
                    // Add 8 vertices for the box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
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
            // Build mesh XML
            let meshXml = `    <mesh>\n      <vertices>\n`;
            for (const [x, y, z] of vertices) {
                meshXml += `        <vertex x="${x}" y="${y}" z="${z}" />\n`;
            }
            meshXml += `      </vertices>\n      <triangles>\n`;
            for (const [v1, v2, v3] of triangles) {
                meshXml += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
            }
            meshXml += `      </triangles>\n    </mesh>\n`;
            
            models.push(`  <object id="${objectId}" type="model">
${meshXml}  </object>`);
            objectId++;
        }
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${models.join('\n')}
  </resources>
  <build>
${models.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;
    
    // Create 3MF zip file
    const zip = new (window as any).JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new (window as any).JSZip();
    const imageFilenames: string[] = [];
    
    // Generate one PNG mask per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Fill black pixels where this color appears
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        imageFilenames.push(filename);
        zip.file(filename, base64Data, { base64: true });
    }
    
    // Generate OpenSCAD file
    let scadCode = `// OpenSCAD file for ${settings.filename}
// Generated by firaga.io

`;
    
    for (let i = 0; i < imageFilenames.length; i++) {
        const part = image.partList[i];
        const filename = imageFilenames[i];
        const colorHex = rgbToHex(part.target.r, part.target.g, part.target.b);
        
        scadCode += `// ${part.target.name} (${part.count} pixels)
color("${colorHex}")
  translate([0, 0, ${settings.baseHeight + i * 0.01}])
  surface(file = "${filename}", center = true, invert = true)
  scale([1, 1, ${settings.height}]);

`;
    }
    
    zip.file(`${settings.filename}.scad`, scadCode);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
