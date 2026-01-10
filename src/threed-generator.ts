import { PartListImage } from "./image-utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    pixelHeight: number;
    pixelWidth: number;
    baseThickness: number;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const width = image.width * settings.pixelWidth;
    const height = image.height * settings.pixelWidth;
    const baseThickness = settings.baseThickness;
    const pixelHeight = settings.pixelHeight;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        xml += `      <base name="${part.target.name}" displaycolor="${colorHex}" />\n`;
    });

    xml += `    </basematerials>\n`;

    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Generate mesh for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const x0 = x * settings.pixelWidth;
                    const y0 = y * settings.pixelWidth;
                    const x1 = x0 + settings.pixelWidth;
                    const y1 = y0 + settings.pixelWidth;
                    const z0 = baseThickness;
                    const z1 = baseThickness + pixelHeight;

                    const baseIdx = vertexCount;

                    // 8 vertices for a box
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face (z1)
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face (y0)
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face (y1)
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`);
                    // Left face (x0)
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Right face (x1)
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${colorIdx + 2}" type="model" name="${part.target.name}">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            xml += vertices.join('\n') + '\n';
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            xml += triangles.join('\n') + '\n';
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });

    // Build item that references all objects
    xml += `    <object id="${image.partList.length + 2}" type="model">\n`;
    xml += `      <components>\n`;
    image.partList.forEach((part, idx) => {
        xml += `        <component objectid="${idx + 2}" p:UUID="${generateUUID()}" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" />\n`;
    });
    xml += `      </components>\n`;
    xml += `    </object>\n`;

    xml += `  </resources>\n`;
    xml += `  <build>\n`;
    xml += `    <item objectid="${image.partList.length + 2}" />\n`;
    xml += `  </build>\n`;
    xml += `</model>`;

    // Create 3MF package (which is a zip file)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    const relsFolder = zip.folder("_rels");
    relsFolder!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "model.3mf");
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");
    
    // Create one mask image per color
    const imagePromises = image.partList.map(async (part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw white pixels where this color appears
        ctx.fillStyle = '#ffffff';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        imagesFolder!.file(filename, blob);
        
        return { filename, colorIdx, color: part.target };
    });
    
    const imageFiles = await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    let scadContent = `// Generated 3D model
// Pixel dimensions: ${settings.pixelWidth}mm x ${settings.pixelWidth}mm
// Pixel height: ${settings.pixelHeight}mm
// Base thickness: ${settings.baseThickness}mm

pixel_width = ${settings.pixelWidth};
pixel_height = ${settings.pixelHeight};
base_thickness = ${settings.baseThickness};
image_width = ${image.width};
image_height = ${image.height};

`;
    
    imageFiles.forEach(({ filename, colorIdx, color }, idx) => {
        scadContent += `
// ${color.name} (${color.code || 'no code'})
color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])
translate([0, 0, base_thickness])
surface(file = "images/${filename}", center = true, invert = true, convexity = 5);

`;
    });
    
    scadContent += `
// Add base plate
translate([0, 0, base_thickness / 2])
cube([image_width * pixel_width, image_height * pixel_width, base_thickness], center = true);
`;
    
    zip.file("model.scad", scadContent);
    
    // Add README
    zip.file("README.txt", `3D Model Export - OpenSCAD Masks

This package contains:
1. One PNG mask per color in the images/ folder
2. An OpenSCAD file (model.scad) that combines them

To use:
1. Open model.scad in OpenSCAD
2. Adjust parameters if needed
3. Render (F6) and export as STL

Settings used:
- Pixel size: ${settings.pixelWidth}mm x ${settings.pixelWidth}mm
- Pixel height: ${settings.pixelHeight}mm
- Base thickness: ${settings.baseThickness}mm
- Image size: ${image.width} x ${image.height} pixels

Colors:
${imageFiles.map(({ color }) => `- ${color.name}${color.code ? ` (${color.code})` : ''}`).join('\n')}
`);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "openscad-masks.zip");
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
