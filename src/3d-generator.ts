import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Generate a 3MF (3D Manufacturing Format) file from the image
 */
export function make3MF(image: PartListImage, filename: string) {
    // 3MF is essentially a ZIP file containing XML files
    const zip = new JSZip();
    
    // Create the [Content_Types].xml file
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.folder("_rels")!.file(".rels", rels);
    
    // Build the 3D model XML
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRgb(hex);
        modelXml += `\n            <base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />`;
    });
    
    modelXml += `\n        </basematerials>`;
    
    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create 3D boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a small box (1mm x 1mm x 1mm) at this position
                    const baseVertex = vertexCount;
                    const x0 = x, x1 = x + 1;
                    const y0 = y, y1 = y + 1;
                    const z0 = 0, z1 = 1;
                    
                    // 8 vertices of the box
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseVertex+0}" v2="${baseVertex+2}" v3="${baseVertex+1}" />`);
                    triangles.push(`<triangle v1="${baseVertex+0}" v2="${baseVertex+3}" v3="${baseVertex+2}" />`);
                    // Top face
                    triangles.push(`<triangle v1="${baseVertex+4}" v2="${baseVertex+5}" v3="${baseVertex+6}" />`);
                    triangles.push(`<triangle v1="${baseVertex+4}" v2="${baseVertex+6}" v3="${baseVertex+7}" />`);
                    // Front face
                    triangles.push(`<triangle v1="${baseVertex+0}" v2="${baseVertex+1}" v3="${baseVertex+5}" />`);
                    triangles.push(`<triangle v1="${baseVertex+0}" v2="${baseVertex+5}" v3="${baseVertex+4}" />`);
                    // Back face
                    triangles.push(`<triangle v1="${baseVertex+2}" v2="${baseVertex+3}" v3="${baseVertex+7}" />`);
                    triangles.push(`<triangle v1="${baseVertex+2}" v2="${baseVertex+7}" v3="${baseVertex+6}" />`);
                    // Left face
                    triangles.push(`<triangle v1="${baseVertex+0}" v2="${baseVertex+4}" v3="${baseVertex+7}" />`);
                    triangles.push(`<triangle v1="${baseVertex+0}" v2="${baseVertex+7}" v3="${baseVertex+3}" />`);
                    // Right face
                    triangles.push(`<triangle v1="${baseVertex+1}" v2="${baseVertex+2}" v3="${baseVertex+6}" />`);
                    triangles.push(`<triangle v1="${baseVertex+1}" v2="${baseVertex+6}" v3="${baseVertex+5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            modelXml += `\n        <object id="${colorIdx + 2}" type="model">
            <mesh>
                <vertices>
                    ${vertices.join('\n                    ')}
                </vertices>
                <triangles>
                    ${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`;
        }
    });
    
    modelXml += `\n    </resources>
    <build>`;
    
    // Add each color object to the build
    image.partList.forEach((part, colorIdx) => {
        modelXml += `\n        <item objectid="${colorIdx + 2}" partnumber="${escapeXml(part.target.name)}" />`;
    });
    
    modelXml += `\n    </build>
</model>`;
    
    zip.folder("3D")!.file("3dmodel.model", modelXml);
    
    // Generate and download the ZIP file
    zip.generateAsync({ type: "blob" }).then(blob => {
        saveAs(blob, filename + ".3mf");
    });
}

/**
 * Generate OpenSCAD masks - a ZIP with monochrome images and .scad file
 */
export function makeOpenSCADMasks(image: PartListImage, filename: string) {
    const zip = new JSZip();
    
    // Create one PNG per color (black/white mask)
    const imagePromises: Promise<void>[] = [];
    
    image.partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                    zip.file(`mask_${colorIdx}_${colorName}.png`, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    });
    
    // Create the OpenSCAD file
    let scadContent = `// Generated by firaga.io
// 3D representation of ${filename}

`;
    
    // Add module for each color layer
    image.partList.forEach((part, colorIdx) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRgb(hex);
        const [r, g, b] = rgb.match(/[0-9A-F]{2}/gi)!.map(h => parseInt(h, 16) / 255);
        
        scadContent += `module layer_${colorIdx}_${colorName}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    translate([0, 0, ${colorIdx}])
    surface(file = "mask_${colorIdx}_${colorName}.png", center = true, invert = true);
}

`;
    });
    
    // Add main assembly
    scadContent += `// Main assembly
`;
    image.partList.forEach((part, colorIdx) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        scadContent += `layer_${colorIdx}_${colorName}();\n`;
    });
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Wait for all images to be added, then download
    Promise.all(imagePromises).then(() => {
        zip.generateAsync({ type: "blob" }).then(blob => {
            saveAs(blob, filename + "_openscad.zip");
        });
    });
}

function hexToRgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Return in format #RRGGBB (8-bit per channel)
    return `#${hex.toUpperCase()}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
