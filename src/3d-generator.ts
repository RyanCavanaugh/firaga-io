import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
}

export async function export3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings) {
    const vertices: number[][] = [];
    const triangles: { vertices: [number, number, number], colorIndex: number }[] = [];
    const materials: { r: number, g: number, b: number }[] = [];

    // Create materials from part list
    for (const part of image.partList) {
        materials.push({
            r: part.target.r,
            g: part.target.g,
            b: part.target.b
        });
    }

    // Generate mesh for each pixel
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIndex = image.pixels[y][x];
            if (colorIndex === -1) continue;

            // Create a cube for this pixel
            const x0 = x;
            const x1 = x + 1;
            const y0 = y;
            const y1 = y + 1;
            const z0 = 0;
            const z1 = settings.pixelHeight;

            // Add 8 vertices for the cube
            const baseIdx = vertices.length;
            vertices.push(
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
            );

            // Add 12 triangles (2 per face, 6 faces)
            const faces = [
                [0, 1, 2], [0, 2, 3], // bottom
                [4, 6, 5], [4, 7, 6], // top
                [0, 4, 5], [0, 5, 1], // front
                [1, 5, 6], [1, 6, 2], // right
                [2, 6, 7], [2, 7, 3], // back
                [3, 7, 4], [3, 4, 0]  // left
            ];

            for (const face of faces) {
                triangles.push({
                    vertices: [baseIdx + face[0], baseIdx + face[1], baseIdx + face[2]] as [number, number, number],
                    colorIndex
                });
            }
        }
    }

    // Generate 3MF XML
    const xml = generate3MFContent(vertices, triangles, materials);
    
    // Create zip file with 3MF structure
    const blob = await create3MFZip(xml);
    saveAs(blob, "export.3mf");
}

function generate3MFContent(
    vertices: number[][],
    triangles: { vertices: [number, number, number], colorIndex: number }[],
    materials: { r: number, g: number, b: number }[]
): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">\n';
    
    // Resources section
    xml += '  <resources>\n';
    
    // Define materials
    xml += '    <m:colorgroup id="1">\n';
    for (let i = 0; i < materials.length; i++) {
        const mat = materials[i];
        const color = `#${toHex(mat.r)}${toHex(mat.g)}${toHex(mat.b)}FF`;
        xml += `      <m:color color="${color}" />\n`;
    }
    xml += '    </m:colorgroup>\n';
    
    // Define mesh objects for each color
    for (let colorIdx = 0; colorIdx < materials.length; colorIdx++) {
        const colorTriangles = triangles.filter(t => t.colorIndex === colorIdx);
        if (colorTriangles.length === 0) continue;

        xml += `    <object id="${colorIdx + 2}" type="model" pid="1" pindex="${colorIdx}">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';
        
        // Write vertices
        for (const v of vertices) {
            xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
        }
        
        xml += '        </vertices>\n';
        xml += '        <triangles>\n';
        
        // Write triangles for this color
        for (const tri of colorTriangles) {
            xml += `          <triangle v1="${tri.vertices[0]}" v2="${tri.vertices[1]}" v3="${tri.vertices[2]}" />\n`;
        }
        
        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += '    </object>\n';
    }
    
    xml += '  </resources>\n';
    
    // Build section
    xml += '  <build>\n';
    for (let colorIdx = 0; colorIdx < materials.length; colorIdx++) {
        const colorTriangles = triangles.filter(t => t.colorIndex === colorIdx);
        if (colorTriangles.length === 0) continue;
        xml += `    <item objectid="${colorIdx + 2}" />\n`;
    }
    xml += '  </build>\n';
    
    xml += '</model>\n';
    
    return xml;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

async function create3MFZip(modelXml: string): Promise<Blob> {
    // For now, create a simple implementation using JSZip-like structure
    // Since JSZip is not in dependencies, we'll use a minimal approach
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Add required 3MF files
    zip.file("3D/3dmodel.model", modelXml);
    
    // Add content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Add relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.file("_rels/.rels", rels);
    
    return await zip.generateAsync({ type: "blob" });
}

async function exportOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Create one mask image per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskData = createMaskImage(image, i);
        zip.file(`color_${i}_${sanitizeFilename(part.target.name)}.png`, maskData);
    }
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("heightmap.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "openscad_export.zip");
}

function createMaskImage(image: PartListImage, colorIndex: number): Blob {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelColor = image.pixels[y][x];
            
            if (pixelColor === colorIndex) {
                // White for this color
                imageData.data[idx] = 255;
                imageData.data[idx + 1] = 255;
                imageData.data[idx + 2] = 255;
                imageData.data[idx + 3] = 255;
            } else {
                // Black for others
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 255;
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: "image/png" });
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    let scad = "// Generated OpenSCAD file for multi-color heightmap\n\n";
    
    scad += `// Image dimensions: ${image.width} x ${image.height}\n`;
    scad += `pixel_height = ${settings.pixelHeight};\n`;
    scad += `base_height = ${settings.baseHeight};\n\n`;
    
    scad += "union() {\n";
    
    // Base layer
    scad += `  // Base layer\n`;
    scad += `  color([0.5, 0.5, 0.5])\n`;
    scad += `    translate([0, 0, -base_height])\n`;
    scad += `    cube([${image.width}, ${image.height}, base_height]);\n\n`;
    
    // Add each color layer
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scad += `  // ${part.target.name}\n`;
        scad += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scad += `    scale([1, 1, pixel_height])\n`;
        scad += `    surface(file = "${filename}", center = false, invert = true);\n\n`;
    }
    
    scad += "}\n";
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
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
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
