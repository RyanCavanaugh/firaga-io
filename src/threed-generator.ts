import { PartListImage } from "./image-utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base in mm
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    loadJSZipAnd(() => {
        if (settings.format === "3mf") {
            generate3MF(image, settings);
        } else {
            generateOpenSCAD(image, settings);
        }
    });
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

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // 3MF format implementation
    // Generate a 3MF file with triangle meshes
    const xml = generate3MFContent(image, settings);
    
    // Create a zip file (3MF is a zip container)
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    zip.file("3D/3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    // OpenSCAD masks format implementation
    // Generate one black/white image per color and an OpenSCAD file
    const zip = new JSZip();
    
    // Generate masks for each color
    const scadContent = generateOpenSCADFile(image, settings);
    
    for (let i = 0; i < image.partList.length; i++) {
        const maskCanvas = createColorMask(image, i);
        const blob = await new Promise<Blob>((resolve) => {
            maskCanvas.toBlob((b) => resolve(b!), "image/png");
        });
        zip.file(`color_${i}.png`, blob);
    }
    
    zip.file("model.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_model.zip");
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height } = image;
    const pixelSize = 1.0; // 1mm per pixel in XY plane
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        xml += `
            <base name="${color.name}" displaycolor="#${r}${g}${b}FF"/>`;
    });
    
    xml += `
        </basematerials>`;
    
    // Generate object for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;
        
        // Build mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.pixelHeight;
                    
                    // 8 vertices for a box
                    const v0 = vertexId++;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    const v1 = vertexId++;
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    const v2 = vertexId++;
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    const v3 = vertexId++;
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    const v4 = vertexId++;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    const v5 = vertexId++;
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    const v6 = vertexId++;
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    const v7 = vertexId++;
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles for a box (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${v0}" v2="${v2}" v3="${v1}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v3}" v3="${v2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${v4}" v2="${v5}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v4}" v2="${v6}" v3="${v7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${v0}" v2="${v1}" v3="${v5}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v5}" v3="${v4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${v3}" v2="${v7}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v3}" v2="${v6}" v3="${v2}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${v0}" v2="${v4}" v3="${v7}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v7}" v3="${v3}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v1}" v2="${v6}" v3="${v5}"/>`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `
        <object id="${objectId}" type="model" pid="1" pindex="${colorIdx}">
            <mesh>
                <vertices>
                    ${vertices.join('\n                    ')}
                </vertices>
                <triangles>
                    ${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`;
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    xml += `
    </resources>
    <build>`;
    
    objectIds.forEach(id => {
        xml += `
        <item objectid="${id}"/>`;
    });
    
    xml += `
    </build>
</model>`;
    
    return xml;
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height } = image;
    const pixelSize = 1.0; // 1mm per pixel
    
    let scad = `// Generated OpenSCAD file for image: ${width}x${height}
// Pixel size: ${pixelSize}mm
// Base height: ${settings.baseHeight}mm
// Pixel height: ${settings.pixelHeight}mm

`;
    
    // Generate a module for each color using surface from heightmap
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scad += `
// ${color.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${settings.baseHeight}])
scale([${pixelSize}, ${pixelSize}, ${settings.pixelHeight}])
surface(file = "color_${idx}.png", center = false, invert = true);
`;
    });
    
    return scad;
}

function createColorMask(image: PartListImage, colorIndex: number): HTMLCanvasElement {
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
                // Black for other colors or transparent
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 255;
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
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
