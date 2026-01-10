import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    height: number;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    loadJSZipAnd(() => make3DWorker(image, settings));
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

async function make3DWorker(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad") {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const modelHeight = settings.height;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials for each color
    xml += '    <basematerials id="1">\n';
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />\n`;
    });
    xml += '    </basematerials>\n';

    // Create mesh for each color
    let objectId = 2;
    partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels with this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x;
                    const y0 = y;
                    const x1 = x + 1;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = modelHeight;

                    const baseIdx = vertices.length;
                    
                    // 8 vertices of the cube
                    vertices.push([x0, y0, z0]); // 0
                    vertices.push([x1, y0, z0]); // 1
                    vertices.push([x1, y1, z0]); // 2
                    vertices.push([x0, y1, z0]); // 3
                    vertices.push([x0, y0, z1]); // 4
                    vertices.push([x1, y0, z1]); // 5
                    vertices.push([x1, y1, z1]); // 6
                    vertices.push([x0, y1, z1]); // 7

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left face
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${objectId}" type="model">\n`;
            xml += '      <mesh>\n';
            xml += '        <vertices>\n';
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            xml += '        </vertices>\n';
            xml += '        <triangles>\n';
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />\n`;
            });
            xml += '        </triangles>\n';
            xml += '      </mesh>\n';
            xml += '    </object>\n';
            objectId++;
        }
    });

    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all objects to the build
    for (let i = 2; i < objectId; i++) {
        xml += `    <item objectid="${i}" />\n`;
    }
    
    xml += '  </build>\n';
    xml += '</model>\n';

    // Create 3MF package (which is a zip file)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    
    // Add required [Content_Types].xml
    const contentTypes = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n' +
        '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n' +
        '</Types>\n';
    zip.file("[Content_Types].xml", contentTypes);
    
    // Add required _rels/.rels
    const rels = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n' +
        '</Relationships>\n';
    zip.file("_rels/.rels", rels);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + ".3mf");
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const zip = new JSZip();

    // Generate one monochrome image per color
    partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
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
        zip.file(`layer_${colorIdx}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
    });

    // Generate OpenSCAD file
    let scadCode = '// Generated by firaga.io\n';
    scadCode += '// 3D representation of pixel art\n\n';
    scadCode += `width = ${width};\n`;
    scadCode += `height = ${height};\n`;
    scadCode += `layer_height = ${settings.height};\n\n`;
    
    scadCode += 'module pixel_layer(image_file, color) {\n';
    scadCode += '  color(color)\n';
    scadCode += '  scale([1, 1, layer_height])\n';
    scadCode += '  surface(file=image_file, center=true, invert=true);\n';
    scadCode += '}\n\n';
    
    scadCode += 'union() {\n';
    partList.forEach((part, colorIdx) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        const filename = `layer_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        scadCode += `  pixel_layer("${filename}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);\n`;
    });
    scadCode += '}\n';

    zip.file(`${settings.filename}.scad`, scadCode);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + "_openscad.zip");
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
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
