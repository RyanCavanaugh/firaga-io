import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    baseHeight: number; // Height of the base in mm
    pixelHeight: number; // Height per pixel in mm
    pixelSize: number; // Size of each pixel in mm
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Load JSZip from CDN if not already loaded
    await loadJSZip();

    const zip = new JSZip();
    
    // Create the 3MF structure
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    // Build the 3D model XML
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials (colors)
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        modelXml += `      <base name="${color.name}" displaycolor="#${hex}" />\n`;
    }
    
    modelXml += `    </basematerials>\n`;

    // Generate meshes for each color
    let objectId = 2;
    const componentRefs: string[] = [];

    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseIndex = vertexIndex;
                    const x0 = x * settings.pixelSize;
                    const x1 = (x + 1) * settings.pixelSize;
                    const y0 = y * settings.pixelSize;
                    const y1 = (y + 1) * settings.pixelSize;
                    const z0 = 0;
                    const z1 = settings.baseHeight + settings.pixelHeight;

                    // Add 8 vertices for the cube
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // Add 12 triangles for the cube (2 per face)
                    // Bottom face
                    triangles.push(`        <triangle v1="${baseIndex}" v2="${baseIndex + 2}" v3="${baseIndex + 1}" />`);
                    triangles.push(`        <triangle v1="${baseIndex}" v2="${baseIndex + 3}" v3="${baseIndex + 2}" />`);
                    // Top face
                    triangles.push(`        <triangle v1="${baseIndex + 4}" v2="${baseIndex + 5}" v3="${baseIndex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseIndex + 4}" v2="${baseIndex + 6}" v3="${baseIndex + 7}" />`);
                    // Front face
                    triangles.push(`        <triangle v1="${baseIndex}" v2="${baseIndex + 1}" v3="${baseIndex + 5}" />`);
                    triangles.push(`        <triangle v1="${baseIndex}" v2="${baseIndex + 5}" v3="${baseIndex + 4}" />`);
                    // Back face
                    triangles.push(`        <triangle v1="${baseIndex + 2}" v2="${baseIndex + 3}" v3="${baseIndex + 7}" />`);
                    triangles.push(`        <triangle v1="${baseIndex + 2}" v2="${baseIndex + 7}" v3="${baseIndex + 6}" />`);
                    // Left face
                    triangles.push(`        <triangle v1="${baseIndex + 3}" v2="${baseIndex}" v3="${baseIndex + 4}" />`);
                    triangles.push(`        <triangle v1="${baseIndex + 3}" v2="${baseIndex + 4}" v3="${baseIndex + 7}" />`);
                    // Right face
                    triangles.push(`        <triangle v1="${baseIndex + 1}" v2="${baseIndex + 2}" v3="${baseIndex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseIndex + 1}" v2="${baseIndex + 6}" v3="${baseIndex + 5}" />`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            modelXml += `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>\n`;
            
            componentRefs.push(`      <component objectid="${objectId}" />`);
            objectId++;
        }
    }

    // Create a build object that combines all color meshes
    const buildObjectId = objectId;
    modelXml += `    <object id="${buildObjectId}" type="model">
      <components>
${componentRefs.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${buildObjectId}" />
  </build>
</model>`;

    // Add files to the zip
    zip.file("_rels/.rels", rels);
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("3D/3dmodel.model", modelXml);

    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    // Load JSZip from CDN if not already loaded
    await loadJSZip();

    const zip = new JSZip();
    
    // Create a black/white PNG for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Set all pixels to white by default
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;     // R
            imageData.data[i + 1] = 255; // G
            imageData.data[i + 2] = 255; // B
            imageData.data[i + 3] = 255; // A
        }
        
        // Set pixels of this color to black
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const idx = (y * image.width + x) * 4;
                    imageData.data[idx] = 0;     // R
                    imageData.data[idx + 1] = 0; // G
                    imageData.data[idx + 2] = 0; // B
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const colorName = image.partList[colorIndex].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`color_${colorIndex}_${colorName}.png`, blob);
    }
    
    // Create the OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for pixel art display
// Base height: ${settings.baseHeight}mm
// Pixel height: ${settings.pixelHeight}mm
// Pixel size: ${settings.pixelSize}mm

module pixel_layer(image_file, color) {
    color(color)
    scale([${settings.pixelSize}, ${settings.pixelSize}, ${settings.pixelHeight}])
    surface(file = image_file, center = true, invert = true);
}

union() {
    // Base
    color([0.5, 0.5, 0.5])
    translate([${image.width * settings.pixelSize / 2}, ${image.height * settings.pixelSize / 2}, ${settings.baseHeight / 2}])
    cube([${image.width * settings.pixelSize}, ${image.height * settings.pixelSize}, ${settings.baseHeight}], center = true);
    
    // Color layers
`;

    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        
        scadContent += `    translate([0, 0, ${settings.baseHeight}])
    pixel_layer("color_${i}_${colorName}.png", [${r}, ${g}, ${b}]);\n`;
    }
    
    scadContent += `}\n`;
    
    zip.file("model.scad", scadContent);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_model.zip");
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

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
