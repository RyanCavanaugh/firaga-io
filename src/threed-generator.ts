import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    pixelSize: number;
    filename: string;
}

export async function make3DExport(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCAD(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZipAnd(() => {
        const zip = new JSZip();
        
        // Add 3MF model file
        const modelXml = generate3MFModel(image, settings);
        zip.file("3D/3dmodel.model", modelXml);
        
        // Add required content types file
        const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
        zip.file("[Content_Types].xml", contentTypes);
        
        // Add relationships file
        const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
        zip.folder("_rels")?.file(".rels", rels);
        
        // Generate and download
        zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${settings.filename}.3mf`;
            a.click();
            URL.revokeObjectURL(url);
        });
    });
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, pixelHeight } = settings;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `            <base name="${part.target.name}" displaycolor="#${hex}" />\n`;
    });
    
    xml += `        </basematerials>\n`;
    
    // Create mesh object for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: number[] = [];
        let vertexCount = 0;
        
        // Generate mesh for pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    const baseIdx = vertexCount;
                    
                    // 8 vertices of a box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push(baseIdx + 0, baseIdx + 2, baseIdx + 1);
                    triangles.push(baseIdx + 0, baseIdx + 3, baseIdx + 2);
                    // Top
                    triangles.push(baseIdx + 4, baseIdx + 5, baseIdx + 6);
                    triangles.push(baseIdx + 4, baseIdx + 6, baseIdx + 7);
                    // Front
                    triangles.push(baseIdx + 0, baseIdx + 1, baseIdx + 5);
                    triangles.push(baseIdx + 0, baseIdx + 5, baseIdx + 4);
                    // Right
                    triangles.push(baseIdx + 1, baseIdx + 2, baseIdx + 6);
                    triangles.push(baseIdx + 1, baseIdx + 6, baseIdx + 5);
                    // Back
                    triangles.push(baseIdx + 2, baseIdx + 3, baseIdx + 7);
                    triangles.push(baseIdx + 2, baseIdx + 7, baseIdx + 6);
                    // Left
                    triangles.push(baseIdx + 3, baseIdx + 0, baseIdx + 4);
                    triangles.push(baseIdx + 3, baseIdx + 4, baseIdx + 7);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `        <object id="${colorIdx + 2}" type="model">\n`;
            xml += `            <mesh>\n`;
            xml += `                <vertices>\n`;
            
            vertices.forEach(v => {
                xml += `                    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            
            xml += `                </vertices>\n`;
            xml += `                <triangles>\n`;
            
            for (let i = 0; i < triangles.length; i += 3) {
                xml += `                    <triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" pid="1" p1="${colorIdx}" />\n`;
            }
            
            xml += `                </triangles>\n`;
            xml += `            </mesh>\n`;
            xml += `        </object>\n`;
        }
    });
    
    xml += `    </resources>\n`;
    xml += `    <build>\n`;
    
    // Add all objects to build
    image.partList.forEach((part, idx) => {
        xml += `        <item objectid="${idx + 2}" />\n`;
    });
    
    xml += `    </build>\n`;
    xml += `</model>`;
    
    return xml;
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZipAnd(() => {
        const zip = new JSZip();
        
        // Generate one mask image per color
        image.partList.forEach((part, colorIdx) => {
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d")!;
            
            // Fill with white background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, image.width, image.height);
            
            // Draw black pixels where this color appears
            ctx.fillStyle = "black";
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[y][x] === colorIdx) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            
            // Convert to PNG and add to zip
            const dataUrl = canvas.toDataURL("image/png");
            const base64 = dataUrl.split(",")[1];
            zip.file(`mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`, base64, { base64: true });
        });
        
        // Generate OpenSCAD file
        const scadContent = generateOpenSCADFile(image, settings);
        zip.file(`${settings.filename}.scad`, scadContent);
        
        // Generate and download
        zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${settings.filename}_openscad.zip`;
            a.click();
            URL.revokeObjectURL(url);
        });
    });
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, pixelHeight } = settings;
    
    let scad = `// Generated OpenSCAD file for ${settings.filename}\n`;
    scad += `// Image size: ${image.width}x${image.height}\n\n`;
    scad += `pixel_size = ${pixelSize};\n`;
    scad += `pixel_height = ${pixelHeight};\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;
    
    scad += `module color_layer(filename, color_rgb) {\n`;
    scad += `    color(color_rgb)\n`;
    scad += `    scale([pixel_size, pixel_size, pixel_height])\n`;
    scad += `    surface(file=filename, center=true, invert=true);\n`;
    scad += `}\n\n`;
    
    scad += `union() {\n`;
    image.partList.forEach((part, idx) => {
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        const filename = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        scad += `    color_layer("${filename}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]); // ${part.target.name}\n`;
    });
    scad += `}\n`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, "_");
}

async function loadJSZipAnd(func: () => void): Promise<void> {
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
