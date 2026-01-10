import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type Export3DSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
};

export async function make3DExport(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await make3MFExport(image, settings);
    } else if (settings.format === "openscad-masks") {
        await makeOpenSCADMasksExport(image, settings);
    }
}

async function make3MFExport(image: PartListImage, settings: Export3DSettings) {
    await loadJSZipAnd(async () => {
        const zip = new JSZip();
        
        // Create the 3MF package structure
        const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
        
        const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

        zip.file("[Content_Types].xml", contentTypes);
        zip.folder("_rels").file(".rels", rels);
        
        // Generate the 3D model
        const model = generate3MFModel(image, settings);
        zip.folder("3D").file("3dmodel.model", model);
        
        // Generate and download
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, settings.filename + ".3mf");
    });
}

function generate3MFModel(image: PartListImage, settings: Export3DSettings): string {
    const { pixelWidth, pixelHeight, pixelDepth } = settings;
    
    let vertices = "";
    let triangles = "";
    let vertexIndex = 0;
    let triangleIndex = 0;
    
    const materials: { [key: string]: number } = {};
    let materialIndex = 0;
    
    // Build material list
    for (const part of image.partList) {
        const colorHex = colorEntryToHex(part.target);
        if (!(colorHex in materials)) {
            materials[colorHex] = materialIndex++;
        }
    }
    
    // Generate meshes for each color
    const meshes: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const colorHex = colorEntryToHex(part.target);
        const matId = materials[colorHex];
        
        let colorVertices = "";
        let colorTriangles = "";
        let colorVertexIndex = 0;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = pixelDepth;
                    
                    // 8 vertices of a cube
                    const cubeVertices = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];
                    
                    const baseIdx = colorVertexIndex;
                    cubeVertices.forEach(v => {
                        colorVertices += `    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>\n`;
                    });
                    colorVertexIndex += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    const cubeFaces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];
                    
                    cubeFaces.forEach(face => {
                        colorTriangles += `    <triangle v1="${baseIdx + face[0]}" v2="${baseIdx + face[1]}" v3="${baseIdx + face[2]}"/>\n`;
                    });
                }
            }
        }
        
        if (colorVertexIndex > 0) {
            meshes.push(`  <object id="${colorIdx + 1}" type="model">
    <mesh>
      <vertices>
${colorVertices}      </vertices>
      <triangles>
${colorTriangles}      </triangles>
    </mesh>
  </object>`);
        }
    }
    
    // Build material resources
    let materialResources = "";
    for (const [color, idx] of Object.entries(materials)) {
        const rgb = hexToRgb(color);
        materialResources += `    <basematerials id="mat${idx}">
      <base name="Color${idx}" displaycolor="${color}"/>
    </basematerials>\n`;
    }
    
    // Build components that reference objects with materials
    let components = "";
    for (let i = 0; i < meshes.length; i++) {
        const part = image.partList[i];
        const colorHex = colorEntryToHex(part.target);
        const matId = materials[colorHex];
        components += `    <component objectid="${i + 1}" p:pindex="0" pid="mat${matId}"/>\n`;
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${settings.filename}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
${materialResources}${meshes.join('\n')}
    <object id="${meshes.length + 1}" type="model">
      <components xmlns:p="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
${components}      </components>
    </object>
  </resources>
  <build>
    <item objectid="${meshes.length + 1}"/>
  </build>
</model>`;
}

async function makeOpenSCADMasksExport(image: PartListImage, settings: Export3DSettings) {
    await loadJSZipAnd(async () => {
        const zip = new JSZip();
        
        // Create one mask image per color
        for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
            const part = image.partList[colorIdx];
            const maskData = createMaskImage(image, colorIdx);
            zip.file(`mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`, maskData, { base64: true });
        }
        
        // Create OpenSCAD file
        const scadContent = generateOpenSCADFile(image, settings);
        zip.file(`${settings.filename}.scad`, scadContent);
        
        // Generate and download
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, settings.filename + ".zip");
    });
}

function createMaskImage(image: PartListImage, colorIdx: number): string {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIdx;
            const value = isColor ? 0 : 255; // black for filled, white for empty
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1]; // Return base64 without header
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { pixelWidth, pixelHeight, pixelDepth } = settings;
    
    let scadCode = `// Generated by firaga.io
// Pixel dimensions: ${pixelWidth}mm x ${pixelHeight}mm x ${pixelDepth}mm

`;
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const colorHex = colorEntryToHex(part.target);
        const rgb = hexToRgb(colorHex);
        const colorName = sanitizeFilename(part.target.name);
        
        scadCode += `// ${part.target.name} (${part.count} pixels)
color([${rgb.r / 255}, ${rgb.g / 255}, ${rgb.b / 255}])
linear_extrude(height=${pixelDepth})
scale([${pixelWidth}, ${pixelHeight}])
surface(file="mask_${colorIdx}_${colorName}.png", invert=true, center=true);

`;
    }
    
    return scadCode;
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function loadJSZipAnd(func: () => void) {
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
