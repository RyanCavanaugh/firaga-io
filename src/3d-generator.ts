import { PartListImage } from "./image-utils";
import { ColorEntry } from "./color-data";

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    filename: string;
    height: number; // Height in mm
    baseHeight: number; // Base/substrate height in mm
};

declare const JSZip: typeof import("jszip");

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZipAnd(() => {
        if (settings.format === "3mf") {
            generate3MF(image, settings);
        } else {
            generateOpenSCAD(image, settings);
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

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    
    // Create 3MF structure
    const modelContent = create3MFModel(image, settings);
    const relsContent = create3MFRels();
    const contentTypesContent = create3MFContentTypes();
    
    zip.file("3D/3dmodel.model", modelContent);
    zip.file("_rels/.rels", relsContent);
    zip.file("[Content_Types].xml", contentTypesContent);
    
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        downloadBlob(blob, `${settings.filename}.3mf`);
    });
}

function create3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const pixelSize = 1.0; // 1mm per pixel
    const { baseHeight, height } = settings;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Create base mesh
    xml += createBaseMesh(image.width, image.height, pixelSize, baseHeight);
    
    // Create mesh for each color
    image.partList.forEach((part, idx) => {
        xml += createColorMesh(image, part.target, idx + 2, pixelSize, baseHeight, height);
    });
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add base to build
    xml += '    <item objectid="1" />\n';
    
    // Add each color mesh to build
    image.partList.forEach((_, idx) => {
        xml += `    <item objectid="${idx + 2}" />\n`;
    });
    
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function createBaseMesh(width: number, height: number, pixelSize: number, baseHeight: number): string {
    const w = width * pixelSize;
    const h = height * pixelSize;
    
    let xml = '    <object id="1" type="model">\n';
    xml += '      <mesh>\n';
    xml += '        <vertices>\n';
    // Bottom vertices
    xml += `          <vertex x="0" y="0" z="0" />\n`;
    xml += `          <vertex x="${w}" y="0" z="0" />\n`;
    xml += `          <vertex x="${w}" y="${h}" z="0" />\n`;
    xml += `          <vertex x="0" y="${h}" z="0" />\n`;
    // Top vertices
    xml += `          <vertex x="0" y="0" z="${baseHeight}" />\n`;
    xml += `          <vertex x="${w}" y="0" z="${baseHeight}" />\n`;
    xml += `          <vertex x="${w}" y="${h}" z="${baseHeight}" />\n`;
    xml += `          <vertex x="0" y="${h}" z="${baseHeight}" />\n`;
    xml += '        </vertices>\n';
    xml += '        <triangles>\n';
    // Bottom
    xml += '          <triangle v1="0" v2="2" v3="1" />\n';
    xml += '          <triangle v1="0" v2="3" v3="2" />\n';
    // Top
    xml += '          <triangle v1="4" v2="5" v3="6" />\n';
    xml += '          <triangle v1="4" v2="6" v3="7" />\n';
    // Sides
    xml += '          <triangle v1="0" v2="1" v3="5" />\n';
    xml += '          <triangle v1="0" v2="5" v3="4" />\n';
    xml += '          <triangle v1="1" v2="2" v3="6" />\n';
    xml += '          <triangle v1="1" v2="6" v3="5" />\n';
    xml += '          <triangle v1="2" v2="3" v3="7" />\n';
    xml += '          <triangle v1="2" v2="7" v3="6" />\n';
    xml += '          <triangle v1="3" v2="0" v3="4" />\n';
    xml += '          <triangle v1="3" v2="4" v3="7" />\n';
    xml += '        </triangles>\n';
    xml += '      </mesh>\n';
    xml += '    </object>\n';
    
    return xml;
}

function createColorMesh(
    image: PartListImage,
    color: ColorEntry,
    objectId: number,
    pixelSize: number,
    baseHeight: number,
    pixelHeight: number
): string {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
    
    // Find all pixels with this color
    const colorIndex = image.partList.findIndex(p => p.target === color);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                // Create a box for this pixel
                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = baseHeight;
                const z1 = baseHeight + pixelHeight;
                
                const baseIdx = vertices.length;
                
                // Add 8 vertices for the box
                vertices.push(
                    { x: x0, y: y0, z: z0 },
                    { x: x1, y: y0, z: z0 },
                    { x: x1, y: y1, z: z0 },
                    { x: x0, y: y1, z: z0 },
                    { x: x0, y: y0, z: z1 },
                    { x: x1, y: y0, z: z1 },
                    { x: x1, y: y1, z: z1 },
                    { x: x0, y: y1, z: z1 }
                );
                
                // Add 12 triangles (2 per face, 6 faces)
                // Bottom
                triangles.push({ v1: baseIdx, v2: baseIdx + 2, v3: baseIdx + 1 });
                triangles.push({ v1: baseIdx, v2: baseIdx + 3, v3: baseIdx + 2 });
                // Top
                triangles.push({ v1: baseIdx + 4, v2: baseIdx + 5, v3: baseIdx + 6 });
                triangles.push({ v1: baseIdx + 4, v2: baseIdx + 6, v3: baseIdx + 7 });
                // Front
                triangles.push({ v1: baseIdx, v2: baseIdx + 1, v3: baseIdx + 5 });
                triangles.push({ v1: baseIdx, v2: baseIdx + 5, v3: baseIdx + 4 });
                // Right
                triangles.push({ v1: baseIdx + 1, v2: baseIdx + 2, v3: baseIdx + 6 });
                triangles.push({ v1: baseIdx + 1, v2: baseIdx + 6, v3: baseIdx + 5 });
                // Back
                triangles.push({ v1: baseIdx + 2, v2: baseIdx + 3, v3: baseIdx + 7 });
                triangles.push({ v1: baseIdx + 2, v2: baseIdx + 7, v3: baseIdx + 6 });
                // Left
                triangles.push({ v1: baseIdx + 3, v2: baseIdx, v3: baseIdx + 4 });
                triangles.push({ v1: baseIdx + 3, v2: baseIdx + 4, v3: baseIdx + 7 });
            }
        }
    }
    
    let xml = `    <object id="${objectId}" type="model">\n`;
    xml += '      <mesh>\n';
    xml += '        <vertices>\n';
    
    vertices.forEach(v => {
        xml += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
    });
    
    xml += '        </vertices>\n';
    xml += '        <triangles>\n';
    
    triangles.forEach(t => {
        xml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
    });
    
    xml += '        </triangles>\n';
    xml += '      </mesh>\n';
    xml += '    </object>\n';
    
    return xml;
}

function create3MFRels(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
    xml += '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n';
    xml += '</Relationships>';
    return xml;
}

function create3MFContentTypes(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
    xml += '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n';
    xml += '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n';
    xml += '</Types>';
    return xml;
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    
    // Generate one B/W PNG for each color
    image.partList.forEach((part, idx) => {
        const pngData = generateColorMask(image, idx);
        zip.file(`color_${idx}_${sanitizeFilename(part.target.name)}.png`, pngData, { base64: true });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        downloadBlob(blob, `${settings.filename}_openscad.zip`);
    });
}

function generateColorMask(image: PartListImage, colorIndex: number): string {
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
            const value = isColor ? 0 : 255; // Black for color, white for empty
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Return base64 encoded PNG (remove data URL prefix)
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.split(",")[1] ?? "";
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const pixelSize = 1.0; // 1mm per pixel
    const { baseHeight, height } = settings;
    
    let scad = '// Generated by firaga.io\n';
    scad += '// 3D representation of bead art pattern\n\n';
    scad += `pixel_size = ${pixelSize};\n`;
    scad += `pixel_height = ${height};\n`;
    scad += `base_height = ${baseHeight};\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;
    
    scad += '// Base plate\n';
    scad += `translate([0, 0, 0]) cube([image_width * pixel_size, image_height * pixel_size, base_height]);\n\n`;
    
    scad += '// Color layers\n';
    image.partList.forEach((part, idx) => {
        const colorName = sanitizeFilename(part.target.name);
        const filename = `color_${idx}_${colorName}.png`;
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scad += `// ${part.target.name}\n`;
        scad += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]) {\n`;
        scad += `  translate([0, 0, base_height]) {\n`;
        scad += `    scale([pixel_size, pixel_size, pixel_height]) {\n`;
        scad += `      surface(file = "${filename}", center = false, invert = true);\n`;
        scad += `    }\n`;
        scad += `  }\n`;
        scad += `}\n\n`;
    });
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
