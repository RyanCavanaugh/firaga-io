import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    pitch: number;
    height: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZipAnd(() => generate3DWorker(image, settings));
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

async function generate3DWorker(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad") {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Create 3MF file content
    const xml = create3MFContent(image, settings);
    
    // Create a zip file (3MF is a zip container)
    const zip = new JSZip();
    
    // Add required files
    zip.file("[Content_Types].xml", getContentTypesXML());
    
    const relsFolder = zip.folder("_rels");
    relsFolder.file(".rels", getRelsXML());
    
    const modelFolder = zip.folder("3D");
    modelFolder.file("3dmodel.model", xml);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const { pitch, height: blockHeight } = settings;
    
    let vertices = "";
    let triangles = "";
    let vertexCount = 0;
    let triangleCount = 0;
    let objectsXML = "";
    
    // Create a separate mesh object for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        if (!part) continue;
        
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        let localVertexCount = 0;
        
        // For each pixel of this color, create a small cube
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube at position (x, y)
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = blockHeight;
                    
                    // 8 vertices of the cube
                    const baseVertex = localVertexCount;
                    colorVertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    localVertexCount += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    colorTriangles.push(
                        // Bottom
                        `<triangle v1="${baseVertex+0}" v2="${baseVertex+1}" v3="${baseVertex+2}" />`,
                        `<triangle v1="${baseVertex+0}" v2="${baseVertex+2}" v3="${baseVertex+3}" />`,
                        // Top
                        `<triangle v1="${baseVertex+4}" v2="${baseVertex+6}" v3="${baseVertex+5}" />`,
                        `<triangle v1="${baseVertex+4}" v2="${baseVertex+7}" v3="${baseVertex+6}" />`,
                        // Front
                        `<triangle v1="${baseVertex+0}" v2="${baseVertex+4}" v3="${baseVertex+5}" />`,
                        `<triangle v1="${baseVertex+0}" v2="${baseVertex+5}" v3="${baseVertex+1}" />`,
                        // Back
                        `<triangle v1="${baseVertex+2}" v2="${baseVertex+6}" v3="${baseVertex+7}" />`,
                        `<triangle v1="${baseVertex+2}" v2="${baseVertex+7}" v3="${baseVertex+3}" />`,
                        // Left
                        `<triangle v1="${baseVertex+0}" v2="${baseVertex+3}" v3="${baseVertex+7}" />`,
                        `<triangle v1="${baseVertex+0}" v2="${baseVertex+7}" v3="${baseVertex+4}" />`,
                        // Right
                        `<triangle v1="${baseVertex+1}" v2="${baseVertex+5}" v3="${baseVertex+6}" />`,
                        `<triangle v1="${baseVertex+1}" v2="${baseVertex+6}" v3="${baseVertex+2}" />`
                    );
                }
            }
        }
        
        if (colorVertices.length > 0) {
            const r = part.target.r / 255;
            const g = part.target.g / 255;
            const b = part.target.b / 255;
            
            objectsXML += `
    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>
${colorVertices.join('\n')}
        </vertices>
        <triangles>
${colorTriangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
        }
    }
    
    // Create component list
    let componentsXML = "";
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        if (!part) continue;
        
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        componentsXML += `      <component objectid="${colorIdx + 2}" />\n`;
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXML}
    <object id="1" type="model">
      <components>
${componentsXML}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
}

function getContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, pixels, partList } = image;
    const { pitch } = settings;
    
    const zip = new JSZip();
    
    // Create a black/white mask image for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        if (!part) continue;
        
        // Create a canvas for this color's mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = '#000000';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob: Blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${colorIdx}_${colorName}.png`, blob);
    }
    
    // Create the OpenSCAD file
    const scadContent = createOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function createOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList } = image;
    const { pitch, height: blockHeight } = settings;
    
    let scadCode = `// Generated by firaga.io
// Image size: ${width}x${height}
// Pitch: ${pitch}mm

`;
    
    // Add a module for each color layer
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        if (!part) continue;
        
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadCode += `
// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIdx * blockHeight}])
scale([${pitch}, ${pitch}, ${blockHeight}])
surface(file = "mask_${colorIdx}_${colorName}.png", invert = true, center = false);

`;
    }
    
    return scadCode;
}
