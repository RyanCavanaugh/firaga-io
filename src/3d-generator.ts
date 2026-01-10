import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    pixelSize: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const fileSaver = await import("file-saver");
    
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    
    fileSaver.saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, pixelSize } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).slice(1); // Remove #
        xml += `      <base name="${part.target.name}" displaycolor="${hex}" />\n`;
    });

    xml += `    </basematerials>\n`;

    // Create objects for each color layer
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build mesh for pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;

                    // Add 8 vertices for a cube
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
                    );

                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${colorIdx + 2}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(([x, y, z]) => {
                xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(([v1, v2, v3]) => {
                xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });

    xml += `  </resources>\n`;
    xml += `  <build>\n`;
    
    // Add all objects to build
    image.partList.forEach((_, idx) => {
        xml += `    <item objectid="${idx + 2}" />\n`;
    });
    
    xml += `  </build>\n`;
    xml += `</model>`;

    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const fileSaver = await import("file-saver");
    
    // Create a simple zip implementation since JSZip is not available
    const files: Array<{ name: string; content: Blob | string }> = [];
    
    // Generate one image per color
    const imageFilenames: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) continue;
        
        // Fill with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "#000000";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to data URL and create blob
        const dataUrl = canvas.toDataURL("image/png");
        const blob = await (await fetch(dataUrl)).blob();
        
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        imageFilenames.push(filename);
        files.push({ name: filename, content: blob });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFilenames, settings);
    files.push({ name: `${settings.filename}.scad`, content: scadContent });
    
    // For now, save files individually (we would need JSZip for proper zipping)
    // Download the scad file and inform user about the masks
    fileSaver.saveAs(new Blob([scadContent], { type: "text/plain" }), `${settings.filename}.scad`);
    
    // Download each mask
    for (const file of files) {
        if (file.name.endsWith(".png")) {
            fileSaver.saveAs(file.content as Blob, file.name);
        }
    }
}

function generateOpenSCADFile(
    image: PartListImage,
    imageFilenames: string[],
    settings: ThreeDSettings
): string {
    const { pixelHeight, pixelSize } = settings;
    
    let scad = `// Generated by firaga.io
// Image size: ${image.width} x ${image.height} pixels
// Pixel size: ${pixelSize}mm
// Pixel height: ${pixelHeight}mm

`;

    // Generate module for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        scad += `// ${part.target.name} (${hex})
module layer_${idx}() {
    color("${hex}")
    scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])
    surface(file = "${imageFilenames[idx]}", invert = true, center = true);
}

`;
    });

    // Combine all layers
    scad += `// Combined model
union() {
`;
    
    image.partList.forEach((_, idx) => {
        scad += `    layer_${idx}();\n`;
    });
    
    scad += `}
`;

    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
