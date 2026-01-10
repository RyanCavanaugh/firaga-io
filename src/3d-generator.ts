import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    depth: number;
    pitch: number;
}

/**
 * Generate 3D output in the selected format
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings, filename);
    } else {
        await generateOpenSCAD(image, settings, filename);
    }
}

/**
 * Generate 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <metadata name="Application">firaga.io</metadata>\n';
    xml += '  <resources>\n';
    
    // Define materials for each color in the part list
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `    <basematerials id="${i + 1}">\n`;
        xml += `      <base name="${part.target.name}" displaycolor="#${hex}" />\n`;
        xml += `    </basematerials>\n`;
    }
    
    let objectId = 1;
    const pitch = settings.pitch;
    const depth = settings.depth;
    
    // Create mesh objects for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        xml += `    <object id="${objectId}" type="model" materialid="${colorIdx + 1}" name="${image.partList[colorIdx].target.name}">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';
        
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate vertices and triangles for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    
                    // Bottom face vertices
                    vertices.push([x0, y0, 0]);
                    vertices.push([x1, y0, 0]);
                    vertices.push([x1, y1, 0]);
                    vertices.push([x0, y1, 0]);
                    
                    // Top face vertices
                    vertices.push([x0, y0, depth]);
                    vertices.push([x1, y0, depth]);
                    vertices.push([x1, y1, depth]);
                    vertices.push([x0, y1, depth]);
                    
                    // Bottom face (2 triangles)
                    triangles.push([baseIdx, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx, baseIdx + 3, baseIdx + 2]);
                    
                    // Top face (2 triangles)
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    
                    // Side faces (8 triangles)
                    triangles.push([baseIdx, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx, baseIdx + 5, baseIdx + 4]);
                    
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                    
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    
                    triangles.push([baseIdx + 3, baseIdx, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                }
            }
        }
        
        // Write vertices
        for (const [x, y, z] of vertices) {
            xml += `          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
        }
        
        xml += '        </vertices>\n';
        xml += '        <triangles>\n';
        
        // Write triangles
        for (const [v1, v2, v3] of triangles) {
            xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        }
        
        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += '    </object>\n';
        
        objectId++;
    }
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all objects to the build
    for (let i = 1; i < objectId; i++) {
        xml += `    <item objectid="${i}" />\n`;
    }
    
    xml += '  </build>\n';
    xml += '</model>\n';
    
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Generate OpenSCAD masks format (zip with monochrome images + .scad file)
 */
async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    const JSZip = (await import("jszip")).default;
    
    const zip = new JSZip();
    const pitch = settings.pitch;
    const depth = settings.depth;
    
    // Generate monochrome PNG for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with black background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw white pixels for this color
        ctx.fillStyle = "#FFFFFF";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        zip.file(`mask_${safeName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    let scadContent = "// Generated by firaga.io\n";
    scadContent += "// 3D pixel art reconstruction\n\n";
    scadContent += `pixel_width = ${pitch};\n`;
    scadContent += `pixel_height = ${depth};\n`;
    scadContent += `image_width = ${image.width};\n`;
    scadContent += `image_height = ${image.height};\n\n`;
    
    scadContent += "union() {\n";
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadContent += `  // ${part.target.name}\n`;
        scadContent += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]) {\n`;
        scadContent += `    scale([pixel_width, pixel_width, pixel_height]) {\n`;
        scadContent += `      surface(file = "mask_${safeName}.png", center = false, invert = true);\n`;
        scadContent += `    }\n`;
        scadContent += `  }\n`;
    }
    
    scadContent += "}\n";
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}
