import { PartListImage, PartListEntry } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    depth: number; // Height of each pixel in the 3D model
    baseHeight: number; // Height of the base layer
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await makeOpenSCADMasks(image, settings);
    }
}

// Generate a 3MF file (3D Manufacturing Format)
async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Add [Content_Types].xml
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    // Add _rels/.rels
    const relsFolder = zip.folder("_rels");
    relsFolder!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    // Generate 3D model
    const modelXml = generate3DModel(image, settings);
    
    const threeDFolder = zip.folder("3D");
    threeDFolder!.file("3dmodel.model", modelXml);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3DModel(image: PartListImage, settings: ThreeDSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const rgb = hexToRgb(hex);
        xml += `\n      <base name="${entry.target.name}" displaycolor="${rgb}" />`;
    });
    
    xml += `\n    </basematerials>`;
    
    // Create objects for each color
    let objectId = 2;
    const colorObjects: number[] = [];
    
    image.partList.forEach((entry, colorIdx) => {
        const meshData = generateMeshForColor(image, colorIdx, settings);
        if (meshData.vertices.length > 0) {
            xml += `\n    <object id="${objectId}" type="model">
      <mesh>
        <vertices>`;
            
            meshData.vertices.forEach(v => {
                xml += `\n          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`;
            });
            
            xml += `\n        </vertices>
        <triangles>`;
            
            meshData.triangles.forEach(t => {
                xml += `\n          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />`;
            });
            
            xml += `\n        </triangles>
      </mesh>
    </object>`;
            colorObjects.push(objectId);
            objectId++;
        }
    });
    
    xml += `\n  </resources>
  <build>`;
    
    colorObjects.forEach(id => {
        xml += `\n    <item objectid="${id}" />`;
    });
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

interface MeshData {
    vertices: [number, number, number][];
    triangles: [number, number, number][];
}

function generateMeshForColor(image: PartListImage, colorIdx: number, settings: ThreeDSettings): MeshData {
    const vertices: [number, number, number][] = [];
    const triangles: [number, number, number][] = [];
    
    // Generate a simple heightmap-style mesh
    // Each pixel becomes a 1x1 block at the appropriate height
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                const baseIdx = vertices.length;
                
                // Bottom face (z = 0)
                vertices.push([x, y, 0]);
                vertices.push([x + 1, y, 0]);
                vertices.push([x + 1, y + 1, 0]);
                vertices.push([x, y + 1, 0]);
                
                // Top face (z = depth)
                vertices.push([x, y, settings.depth]);
                vertices.push([x + 1, y, settings.depth]);
                vertices.push([x + 1, y + 1, settings.depth]);
                vertices.push([x, y + 1, settings.depth]);
                
                // Bottom face triangles
                triangles.push([baseIdx, baseIdx + 2, baseIdx + 1]);
                triangles.push([baseIdx, baseIdx + 3, baseIdx + 2]);
                
                // Top face triangles
                triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                
                // Side faces
                // Front
                triangles.push([baseIdx, baseIdx + 1, baseIdx + 5]);
                triangles.push([baseIdx, baseIdx + 5, baseIdx + 4]);
                
                // Right
                triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                
                // Back
                triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                
                // Left
                triangles.push([baseIdx + 3, baseIdx, baseIdx + 4]);
                triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
            }
        }
    }
    
    return { vertices, triangles };
}

// Generate OpenSCAD masks format (ZIP with images + .scad file)
async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Generate one mask image per color
    const imagePromises = image.partList.map(async (entry, colorIdx) => {
        const maskCanvas = createMaskCanvas(image, colorIdx);
        const blob = await canvasToBlob(maskCanvas);
        const filename = `color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        zip.file(filename, blob);
        return { filename, entry };
    });
    
    const imageFiles = await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function createMaskCanvas(image: PartListImage, colorIdx: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    // Fill with white (transparent)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black pixels where this color appears
    ctx.fillStyle = "black";
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob from canvas"));
            }
        });
    });
}

function generateOpenSCADFile(
    image: PartListImage,
    imageFiles: Array<{ filename: string; entry: PartListEntry }>,
    settings: ThreeDSettings
): string {
    let scad = `// Generated by firaga.io
// Image dimensions: ${image.width} x ${image.height}

`;
    
    // Add a module for each color layer
    imageFiles.forEach(({ filename, entry }, idx) => {
        const hex = colorEntryToHex(entry.target);
        scad += `// Color: ${entry.target.name} (${hex})
module layer_${idx}() {
  color("${hex}")
  surface(file = "${filename}", center = true, invert = true);
}

`;
    });
    
    // Combine all layers
    scad += `// Combined model
translate([${-image.width / 2}, ${-image.height / 2}, 0]) {
`;
    
    imageFiles.forEach((_, idx) => {
        scad += `  translate([0, 0, ${idx * settings.depth}])
    scale([1, 1, ${settings.depth}])
    layer_${idx}();
`;
    });
    
    scad += `}
`;
    
    return scad;
}

function hexToRgb(hex: string): string {
    // Convert #RRGGBB to #RRGGBB format for 3MF
    if (hex.startsWith('#')) {
        return hex.toUpperCase();
    }
    return `#${hex.toUpperCase()}`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
