import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCAD(image, settings);
    }
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

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create 3MF structure
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

    // Build the 3D model
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const rgb = hexToRgb(hex);
        modelXml += `\n            <base name="${entry.target.name}" displaycolor="${rgb}" />`;
    });
    
    modelXml += `\n        </basematerials>`;
    
    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    image.partList.forEach((entry, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number, number]> = [];
        let vertexOffset = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube at position (x, y) with height pixelHeight
                    const x0 = x, x1 = x + 1;
                    const y0 = y, y1 = y + 1;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.pixelHeight;
                    
                    // Add 8 vertices for the cube
                    const baseIdx = vertexOffset;
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // Add 12 triangles (2 per face * 6 faces)
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1, colorIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2, colorIdx]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6, colorIdx]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7, colorIdx]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5, colorIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4, colorIdx]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7, colorIdx]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6, colorIdx]);
                    // Left
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7, colorIdx]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3, colorIdx]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6, colorIdx]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5, colorIdx]);
                    
                    vertexOffset += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXml += `\n        <object id="${objectId}" type="model">
            <mesh>
                <vertices>`;
            
            vertices.forEach(v => {
                modelXml += `\n                    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`;
            });
            
            modelXml += `\n                </vertices>
                <triangles>`;
            
            triangles.forEach(t => {
                modelXml += `\n                    <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${t[3]}" />`;
            });
            
            modelXml += `\n                </triangles>
            </mesh>
        </object>`;
            
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    modelXml += `\n    </resources>
    <build>`;
    
    // Add all objects to the build
    objectIds.forEach(id => {
        modelXml += `\n        <item objectid="${id}" />`;
    });
    
    modelXml += `\n    </build>
</model>`;

    // Add files to zip
    zip.file("[Content_Types].xml", contentTypes);
    zip.folder("_rels").file(".rels", rels);
    zip.folder("3D").file("3dmodel.model", modelXml);
    
    // Generate and download
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${settings.filename}.3mf`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create monochrome images for each color
    const imagePromises: Promise<void>[] = [];
    
    image.partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background (height 0)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color (height 1)
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const colorName = entry.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const hex = colorEntryToHex(entry.target).substring(1); // Remove #
        const filename = `mask_${colorIdx}_${colorName}_${hex}.png`;
        
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(filename, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel art 3D model using monochrome heightmap masks
// 
// Instructions:
// 1. Extract all files from this zip
// 2. Open the .scad file in OpenSCAD
// 3. Render (F6) and export as STL
//
// Each color layer uses surface() to extrude based on the mask image
// Black pixels (0,0,0) = full height, White pixels (255,255,255) = no height

pixel_height = ${settings.pixelHeight};
base_height = ${settings.baseHeight};

module color_layer(image_file, color) {
    color(color)
    translate([0, 0, base_height])
    linear_extrude(height = pixel_height)
    projection(cut = false)
    translate([0, 0, -10])
    surface(file = image_file, center = false, invert = true);
}

union() {
`;
    
    // Add each color layer
    image.partList.forEach((entry, colorIdx) => {
        const colorName = entry.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const hex = colorEntryToHex(entry.target);
        const rgb = hexToRgb(hex);
        const rgbParts = rgb.split(" ").map(c => parseInt(c));
        const rgbNorm = rgbParts.map(c => (c / 255).toFixed(3)).join(", ");
        
        scadContent += `    color_layer("mask_${colorIdx}_${colorName}_${hex.substring(1)}.png", [${rgbNorm}]);\n`;
    });
    
    scadContent += `}
`;
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Wait for all images to be added, then generate zip
    Promise.all(imagePromises).then(() => {
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

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `${r} ${g} ${b}`;
    }
    return "255 255 255";
}
