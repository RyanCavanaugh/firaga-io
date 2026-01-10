import { PartListImage } from "./image-utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    baseHeight: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCAD(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with triangle mesh
    const xml = generate3MFContent(image, settings);
    
    // Create a zip file (3MF is a zip archive)
    const zip = new JSZip();
    
    // Add required files
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    zip.folder("3D");
    zip.file("3D/3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "model.3mf");
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const meshes: string[] = [];
    let objectId = 1;
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;
        
        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a rectangular prism for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.pixelHeight;
                    
                    // 8 vertices for the box
                    const baseIdx = vertexId;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}"/>`);
                    
                    vertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
            meshes.push(`
    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
                ${vertices.join('\n                ')}
            </vertices>
            <triangles>
                ${triangles.join('\n                ')}
            </triangles>
        </mesh>
    </object>
    <object id="${objectId + 1000}" type="model">
        <components>
            <component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
        </components>
    </object>`);
            
            objectId++;
        }
    }
    
    const buildItems = meshes.map((_, idx) => 
        `<item objectid="${idx + 1001}" />`
    ).join('\n            ');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
${meshes.join('\n')}
    </resources>
    <build>
        ${buildItems}
    </build>
</model>`;
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create monochrome images for each color
    const imagePromises: Promise<void>[] = [];
    const colorNames: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const safeName = color.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `color_${colorIdx}_${safeName}.png`;
        colorNames.push(filename);
        
        imagePromises.push(createMonochromeImage(image, colorIdx, zip, filename));
    }
    
    await Promise.all(imagePromises);
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings, colorNames);
    zip.file("model.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "openscad_model.zip");
}

async function createMonochromeImage(
    image: PartListImage, 
    colorIdx: number, 
    zip: JSZip, 
    filename: string
): Promise<void> {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    // Create black and white image
    const imageData = ctx.createImageData(image.width, image.height);
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const value = image.pixels[y][x] === colorIdx ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                zip.file(filename, blob);
            }
            resolve();
        });
    });
}

function generateOpenSCADFile(
    image: PartListImage, 
    settings: ThreeDSettings,
    colorNames: string[]
): string {
    const lines: string[] = [];
    
    lines.push("// Generated 3D model from pixel art");
    lines.push(`// Image size: ${image.width}x${image.height}`);
    lines.push("");
    lines.push("// Parameters");
    lines.push(`pixel_height = ${settings.pixelHeight};`);
    lines.push(`base_height = ${settings.baseHeight};`);
    lines.push("");
    
    // Generate color modules
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i];
        const filename = colorNames[i];
        const colorRGB = [
            color.target.r / 255,
            color.target.g / 255,
            color.target.b / 255
        ];
        
        lines.push(`// Color: ${color.target.name}`);
        lines.push(`module color_${i}() {`);
        lines.push(`    color([${colorRGB[0]}, ${colorRGB[1]}, ${colorRGB[2]}])`);
        lines.push(`    scale([1, 1, pixel_height/255])`);
        lines.push(`    surface(file = "${filename}", center = true, invert = false);`);
        lines.push(`}`);
        lines.push("");
    }
    
    // Combine all colors
    lines.push("// Combine all colors");
    lines.push("union() {");
    for (let i = 0; i < image.partList.length; i++) {
        lines.push(`    translate([0, 0, base_height]) color_${i}();`);
    }
    lines.push("}");
    
    return lines.join("\n");
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}
