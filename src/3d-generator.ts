import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    baseHeight: number;
    pitch: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Load JSZip if needed
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Add [Content_Types].xml
    zip.file("[Content_Types].xml", generateContentTypes());
    
    // Add _rels/.rels
    zip.folder("_rels").file(".rels", generateRels());
    
    // Add 3D/3dmodel.model (main 3MF file)
    const modelXml = generate3DModel(image, settings);
    zip.folder("3D").file("3dmodel.model", modelXml);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    // Load JSZip if needed
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one PNG per color
    const imagePromises: Promise<void>[] = [];
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color exists
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
                    zip.file(filename, blob);
                }
                resolve();
            });
        });
        
        imagePromises.push(promise);
    }
    
    // Wait for all images to be generated
    await Promise.all(imagePromises);
    
    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("display.scad", scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_masks.zip");
}

function generate3DModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, pixelHeight, baseHeight } = settings;
    
    let vertices: string[] = [];
    let triangles: string[] = [];
    let vertexCount = 0;
    let triangleCount = 0;
    
    // Build geometry for each color as a separate object/component
    const objects: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const color = part.target;
        
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        let colorVertexStart = vertexCount;
        
        // Create a box for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a rectangular prism at this position
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // Add 8 vertices for the box
                    const v0 = vertexCount++;
                    colorVertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    colorVertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    colorVertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    colorVertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    colorVertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    colorVertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    colorVertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    colorVertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    vertexCount += 8;
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    colorTriangles.push(`<triangle v1="${v0}" v2="${v0+2}" v3="${v0+1}" />`);
                    colorTriangles.push(`<triangle v1="${v0}" v2="${v0+3}" v3="${v0+2}" />`);
                    // Top face
                    colorTriangles.push(`<triangle v1="${v0+4}" v2="${v0+5}" v3="${v0+6}" />`);
                    colorTriangles.push(`<triangle v1="${v0+4}" v2="${v0+6}" v3="${v0+7}" />`);
                    // Front face
                    colorTriangles.push(`<triangle v1="${v0}" v2="${v0+1}" v3="${v0+5}" />`);
                    colorTriangles.push(`<triangle v1="${v0}" v2="${v0+5}" v3="${v0+4}" />`);
                    // Back face
                    colorTriangles.push(`<triangle v1="${v0+2}" v2="${v0+3}" v3="${v0+7}" />`);
                    colorTriangles.push(`<triangle v1="${v0+2}" v2="${v0+7}" v3="${v0+6}" />`);
                    // Left face
                    colorTriangles.push(`<triangle v1="${v0+3}" v2="${v0}" v3="${v0+4}" />`);
                    colorTriangles.push(`<triangle v1="${v0+3}" v2="${v0+4}" v3="${v0+7}" />`);
                    // Right face
                    colorTriangles.push(`<triangle v1="${v0+1}" v2="${v0+2}" v3="${v0+6}" />`);
                    colorTriangles.push(`<triangle v1="${v0+1}" v2="${v0+6}" v3="${v0+5}" />`);
                    
                    triangleCount += 12;
                }
            }
        }
        
        if (colorVertices.length > 0) {
            vertices.push(...colorVertices);
            triangles.push(...colorTriangles);
            
            // Create object for this color
            const hexColor = colorEntryToHex(color).substring(1); // Remove #
            const r = parseInt(hexColor.substring(0, 2), 16);
            const g = parseInt(hexColor.substring(2, 4), 16);
            const b = parseInt(hexColor.substring(4, 6), 16);
            
            objects.push(`
    <object id="${colorIndex + 2}" type="model">
      <mesh>
        <vertices>
${colorVertices.join('\n')}
        </vertices>
        <triangles>
${colorTriangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    // Create the complete 3MF model
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
    <object id="1" type="model">
      <components>
${image.partList.map((_, i) => `        <component objectid="${i + 2}" />`).join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, pixelHeight } = settings;
    
    let scadCode = `// Generated OpenSCAD file for 3D pixel art
// Image size: ${image.width}x${image.height}
// Pitch: ${pitch}mm

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
        const hexColor = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) / 255;
        const g = parseInt(hexColor.substring(2, 4), 16) / 255;
        const b = parseInt(hexColor.substring(4, 6), 16) / 255;
        
        scadCode += `
// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([${pitch}, ${pitch}, ${pixelHeight}])
    surface(file = "${filename}", center = false, invert = true);
`;
    }
    
    return scadCode;
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
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
