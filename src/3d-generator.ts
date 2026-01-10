import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type Export3DSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    height: number; // Height in mm for the 3D object
};

export async function make3DExport(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: Export3DSettings) {
    await loadJSZipAnd(() => make3MFWorker(image, settings));
}

async function makeOpenSCADMasks(image: PartListImage, settings: Export3DSettings) {
    await loadJSZipAnd(() => makeOpenSCADMasksWorker(image, settings));
}

async function loadJSZipAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

function make3MFWorker(image: PartListImage, settings: Export3DSettings) {
    // Create 3MF file structure
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file("[Content_Types].xml", generateContentTypesXML());
    zip.file("_rels/.rels", generateRelsXML());
    
    // Generate 3D model XML with separate objects for each color
    const modelXML = generate3DModelXML(image, settings.height);
    zip.file("3D/3dmodel.model", modelXML);
    
    // Generate and download the zip file
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${settings.filename}.3mf`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3DModelXML(image: PartListImage, heightMm: number): string {
    const pixelSize = 1.0; // 1mm per pixel
    let vertexId = 1;
    let triangleId = 1;
    
    let vertices = "";
    let triangles = "";
    let objects = "";
    let materials = "";
    
    // Create a material for each color
    image.partList.forEach((part, colorIndex) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        materials += `        <basematerials:base name="${color.name}" displaycolor="#${hex}FF" />\n`;
    });
    
    // Create separate mesh objects for each color
    image.partList.forEach((part, colorIndex) => {
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        const startVertexId = vertexId;
        
        // Build voxels for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a voxel (rectangular prism) for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = heightMm;
                    
                    const baseVid = vertexId;
                    // 8 vertices of the voxel
                    colorVertices.push(`            <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    colorVertices.push(`            <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    colorVertices.push(`            <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    colorVertices.push(`            <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    colorVertices.push(`            <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    colorVertices.push(`            <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    colorVertices.push(`            <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    colorVertices.push(`            <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    vertexId += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    colorTriangles.push(`            <triangle v1="${baseVid}" v2="${baseVid + 1}" v3="${baseVid + 2}" />`);
                    colorTriangles.push(`            <triangle v1="${baseVid}" v2="${baseVid + 2}" v3="${baseVid + 3}" />`);
                    // Top face (z=heightMm)
                    colorTriangles.push(`            <triangle v1="${baseVid + 4}" v2="${baseVid + 6}" v3="${baseVid + 5}" />`);
                    colorTriangles.push(`            <triangle v1="${baseVid + 4}" v2="${baseVid + 7}" v3="${baseVid + 6}" />`);
                    // Front face (y=y0)
                    colorTriangles.push(`            <triangle v1="${baseVid}" v2="${baseVid + 4}" v3="${baseVid + 5}" />`);
                    colorTriangles.push(`            <triangle v1="${baseVid}" v2="${baseVid + 5}" v3="${baseVid + 1}" />`);
                    // Back face (y=y1)
                    colorTriangles.push(`            <triangle v1="${baseVid + 2}" v2="${baseVid + 6}" v3="${baseVid + 7}" />`);
                    colorTriangles.push(`            <triangle v1="${baseVid + 2}" v2="${baseVid + 7}" v3="${baseVid + 3}" />`);
                    // Left face (x=x0)
                    colorTriangles.push(`            <triangle v1="${baseVid}" v2="${baseVid + 3}" v3="${baseVid + 7}" />`);
                    colorTriangles.push(`            <triangle v1="${baseVid}" v2="${baseVid + 7}" v3="${baseVid + 4}" />`);
                    // Right face (x=x1)
                    colorTriangles.push(`            <triangle v1="${baseVid + 1}" v2="${baseVid + 5}" v3="${baseVid + 6}" />`);
                    colorTriangles.push(`            <triangle v1="${baseVid + 1}" v2="${baseVid + 6}" v3="${baseVid + 2}" />`);
                }
            }
        }
        
        if (colorVertices.length > 0) {
            // Create mesh for this color
            objects += `    <object id="${colorIndex + 1}" type="model" pid="1" pindex="${colorIndex}">\n`;
            objects += `        <mesh>\n`;
            objects += `        <vertices>\n`;
            objects += colorVertices.join('\n') + '\n';
            objects += `        </vertices>\n`;
            objects += `        <triangles>\n`;
            objects += colorTriangles.join('\n') + '\n';
            objects += `        </triangles>\n`;
            objects += `        </mesh>\n`;
            objects += `    </object>\n`;
        }
    });
    
    // Build items (instances of objects)
    let items = "";
    image.partList.forEach((part, colorIndex) => {
        items += `        <item objectid="${colorIndex + 1}" />\n`;
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
    <resources>
    <basematerials:basematerials id="1">
${materials}    </basematerials:basematerials>
${objects}    </resources>
    <build>
${items}    </build>
</model>`;
}

function makeOpenSCADMasksWorker(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    // Create one black/white image per color
    image.partList.forEach((part, colorIndex) => {
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
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${colorIndex}_${safeName}.png`, base64Data, { base64: true });
    });
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings.height);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download the zip file
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${settings.filename}_openscad.zip`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateOpenSCADFile(image: PartListImage, heightMm: number): string {
    let scadCode = `// Generated OpenSCAD file for ${image.width}x${image.height} image
// Each color layer is loaded from a heightmap image

pixel_size = 1; // mm per pixel
height = ${heightMm}; // mm

`;
    
    // Add a module for each color
    image.partList.forEach((part, colorIndex) => {
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadCode += `// ${part.target.name}\n`;
        scadCode += `module layer_${colorIndex}() {\n`;
        scadCode += `    color([${r}, ${g}, ${b}])\n`;
        scadCode += `    scale([pixel_size, pixel_size, height/255])\n`;
        scadCode += `    surface(file = "mask_${colorIndex}_${safeName}.png", center = false, invert = true);\n`;
        scadCode += `}\n\n`;
    });
    
    // Create union of all layers
    scadCode += `// Combine all layers\n`;
    scadCode += `union() {\n`;
    image.partList.forEach((part, colorIndex) => {
        scadCode += `    layer_${colorIndex}();\n`;
    });
    scadCode += `}\n`;
    
    return scadCode;
}
