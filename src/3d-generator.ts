import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    height: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base layer in mm
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string) {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        await generate3MF(image, settings, filename);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings, filename);
    }
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve();
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const zip = new JSZip();
    
    // Create 3MF package structure
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    const relationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    
    // Generate 3D model file
    const modelContent = generate3MFModel(image, settings);
    
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("_rels").file(".rels", relationships);
    zip.folder("3D").file("3dmodel.model", modelContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `      <base name="${color.name}" displaycolor="#${hexColor}" />\n`;
    });
    
    xml += `    </basematerials>\n`;
    
    // Generate mesh for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const cube = createCubeVerticesAndTriangles(
                        x, y, 
                        settings.baseHeight, 
                        settings.height,
                        vertexIndex
                    );
                    vertices.push(...cube.vertices);
                    triangles.push(...cube.triangles);
                    vertexIndex += 8; // 8 vertices per cube
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${colorIdx + 2}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(v => xml += `          ${v}\n`);
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(t => xml += `          ${t}\n`);
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });
    
    xml += `  </resources>\n`;
    xml += `  <build>\n`;
    
    // Add each colored mesh to the build
    image.partList.forEach((part, idx) => {
        // Check if this color has any pixels
        let hasPixels = false;
        for (let y = 0; y < image.height && !hasPixels; y++) {
            for (let x = 0; x < image.width && !hasPixels; x++) {
                if (image.pixels[y][x] === idx) {
                    hasPixels = true;
                }
            }
        }
        if (hasPixels) {
            xml += `    <item objectid="${idx + 2}" pid="1" pindex="${idx}" />\n`;
        }
    });
    
    xml += `  </build>\n`;
    xml += `</model>`;
    
    return xml;
}

function createCubeVerticesAndTriangles(
    x: number, 
    y: number, 
    baseHeight: number, 
    height: number,
    startIndex: number
): { vertices: string[], triangles: string[] } {
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = 0;
    const z1 = baseHeight + height;
    
    const vertices = [
        `<vertex x="${x0}" y="${y0}" z="${z0}" />`, // 0
        `<vertex x="${x1}" y="${y0}" z="${z0}" />`, // 1
        `<vertex x="${x1}" y="${y1}" z="${z0}" />`, // 2
        `<vertex x="${x0}" y="${y1}" z="${z0}" />`, // 3
        `<vertex x="${x0}" y="${y0}" z="${z1}" />`, // 4
        `<vertex x="${x1}" y="${y0}" z="${z1}" />`, // 5
        `<vertex x="${x1}" y="${y1}" z="${z1}" />`, // 6
        `<vertex x="${x0}" y="${y1}" z="${z1}" />`  // 7
    ];
    
    // Two triangles per face, 6 faces
    const triangles = [
        // Bottom face
        `<triangle v1="${startIndex}" v2="${startIndex + 2}" v3="${startIndex + 1}" />`,
        `<triangle v1="${startIndex}" v2="${startIndex + 3}" v3="${startIndex + 2}" />`,
        // Top face
        `<triangle v1="${startIndex + 4}" v2="${startIndex + 5}" v3="${startIndex + 6}" />`,
        `<triangle v1="${startIndex + 4}" v2="${startIndex + 6}" v3="${startIndex + 7}" />`,
        // Front face
        `<triangle v1="${startIndex}" v2="${startIndex + 1}" v3="${startIndex + 5}" />`,
        `<triangle v1="${startIndex}" v2="${startIndex + 5}" v3="${startIndex + 4}" />`,
        // Back face
        `<triangle v1="${startIndex + 3}" v2="${startIndex + 7}" v3="${startIndex + 6}" />`,
        `<triangle v1="${startIndex + 3}" v2="${startIndex + 6}" v3="${startIndex + 2}" />`,
        // Left face
        `<triangle v1="${startIndex}" v2="${startIndex + 4}" v3="${startIndex + 7}" />`,
        `<triangle v1="${startIndex}" v2="${startIndex + 7}" v3="${startIndex + 3}" />`,
        // Right face
        `<triangle v1="${startIndex + 1}" v2="${startIndex + 2}" v3="${startIndex + 6}" />`,
        `<triangle v1="${startIndex + 1}" v2="${startIndex + 6}" v3="${startIndex + 5}" />`
    ];
    
    return { vertices, triangles };
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const zip = new JSZip();
    
    // Generate one mask image per color
    image.partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${colorIdx}_${colorName}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    let scad = `// Generated OpenSCAD model
// Image dimensions: ${image.width} x ${image.height}

pixel_width = 1;
pixel_height = 1;
base_height = ${settings.baseHeight};
layer_height = ${settings.height};

`;
    
    // Create module for each color layer
    image.partList.forEach((part, colorIdx) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        scad += `// ${part.target.name}\n`;
        scad += `module layer_${colorIdx}() {\n`;
        scad += `  surface(file = "mask_${colorIdx}_${colorName}.png", center = true, invert = true);\n`;
        scad += `}\n\n`;
    });
    
    // Combine all layers
    scad += `// Combine all layers\n`;
    scad += `union() {\n`;
    
    // Add base
    scad += `  // Base layer\n`;
    scad += `  translate([0, 0, 0])\n`;
    scad += `    cube([${image.width}, ${image.height}, base_height], center = true);\n\n`;
    
    // Add each color layer
    image.partList.forEach((part, colorIdx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        scad += `  // ${part.target.name}\n`;
        scad += `  color([${r}, ${g}, ${b}])\n`;
        scad += `    translate([0, 0, base_height + layer_height / 2])\n`;
        scad += `      scale([pixel_width, pixel_height, layer_height])\n`;
        scad += `        layer_${colorIdx}();\n\n`;
    });
    
    scad += `}\n`;
    
    return scad;
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
