import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { pixels, width, height, partList } = image;
    
    // Build 3MF file content
    let content = '<?xml version="1.0" encoding="UTF-8"?>\n';
    content += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    content += '  <resources>\n';
    
    // Define materials for each color
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        content += `    <basematerials id="${idx + 1}">\n`;
        content += `      <base name="${part.target.name}" displaycolor="#${hex}" />\n`;
        content += `    </basematerials>\n`;
    });
    
    // Create mesh objects for each color
    let objectId = 1;
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate geometry for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    
                    // Create a box (cube) for this pixel
                    // Bottom face vertices
                    vertices.push([x, y, 0]);
                    vertices.push([x + 1, y, 0]);
                    vertices.push([x + 1, y + 1, 0]);
                    vertices.push([x, y + 1, 0]);
                    
                    // Top face vertices
                    vertices.push([x, y, settings.pixelHeight]);
                    vertices.push([x + 1, y, settings.pixelHeight]);
                    vertices.push([x + 1, y + 1, settings.pixelHeight]);
                    vertices.push([x, y + 1, settings.pixelHeight]);
                    
                    // Create triangles for the box (12 triangles for 6 faces)
                    // Bottom face
                    triangles.push([baseIdx, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx, baseIdx + 3, baseIdx + 2]);
                    
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    
                    // Front face
                    triangles.push([baseIdx, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx, baseIdx + 5, baseIdx + 4]);
                    
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    
                    // Left face
                    triangles.push([baseIdx, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx, baseIdx + 7, baseIdx + 3]);
                    
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            content += `    <object id="${objectId}" type="model">\n`;
            content += `      <mesh>\n`;
            content += `        <vertices>\n`;
            vertices.forEach(v => {
                content += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            content += `        </vertices>\n`;
            content += `        <triangles>\n`;
            triangles.forEach(t => {
                content += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="${colorIdx + 1}" p1="0" />\n`;
            });
            content += `        </triangles>\n`;
            content += `      </mesh>\n`;
            content += `    </object>\n`;
            objectId++;
        }
    });
    
    content += '  </resources>\n';
    content += '  <build>\n';
    
    // Add all objects to the build
    for (let i = 1; i < objectId; i++) {
        content += `    <item objectid="${i}" />\n`;
    }
    
    content += '  </build>\n';
    content += '</model>\n';
    
    // Download the file
    downloadFile(content, settings.filename + '.3mf', 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const { pixels, width, height, partList } = image;
    
    // We'll use JSZip dynamically loaded
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Generate one black/white image per color
    partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(`color_${colorIdx}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    let scadContent = '// Generated by firaga.io\n';
    scadContent += '// 3D representation of pixel art image\n\n';
    scadContent += `pixel_height = ${settings.pixelHeight};\n`;
    scadContent += `base_height = ${settings.baseHeight};\n`;
    scadContent += `width = ${width};\n`;
    scadContent += `height = ${height};\n\n`;
    
    scadContent += 'union() {\n';
    
    partList.forEach((part, colorIdx) => {
        const filename = `color_${colorIdx}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadContent += `  // ${part.target.name}\n`;
        scadContent += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  translate([0, 0, base_height])\n`;
        scadContent += `  scale([1, 1, pixel_height])\n`;
        scadContent += `  surface(file = "${filename}", center = false, invert = true);\n\n`;
    });
    
    scadContent += '}\n';
    
    zip.file('model.scad', scadContent);
    
    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = settings.filename + '_openscad.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<any> {
    const tagName = "jszip-script-tag";
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if ((window as any).JSZip) {
            resolve((window as any).JSZip);
            return;
        }
        
        // Load from CDN
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.onerror = () => {
                reject(new Error("Failed to load JSZip"));
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve((window as any).JSZip);
        }
    });
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
