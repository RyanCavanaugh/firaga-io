import { PartListImage } from "./image-utils";
import { getPitch } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    gridSize: readonly [number, number];
    pitch: number;
    height: number; // Height in mm
    filename: string;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const pitchMm = settings.pitch;
    const heightMm = settings.height;
    
    // Build 3MF XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials (colors)
    xml += '    <basematerials id="1">\n';
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = rgbToHex(color.r, color.g, color.b);
        xml += `      <base name="${escapeXml(color.name)}" displaycolor="${hexColor}" />\n`;
    }
    xml += '    </basematerials>\n';
    
    // Create mesh objects for each color
    let objectId = 2;
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const baseIdx = vertices.length;
                    const x0 = x * pitchMm;
                    const x1 = (x + 1) * pitchMm;
                    const y0 = y * pitchMm;
                    const y1 = (y + 1) * pitchMm;
                    const z0 = 0;
                    const z1 = heightMm;
                    
                    // 8 vertices of a box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]); // bottom
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); // top
                    
                    // 12 triangles (2 per face, 6 faces)
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
            xml += `    <object id="${objectId}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            for (const [vx, vy, vz] of vertices) {
                xml += `          <vertex x="${vx.toFixed(3)}" y="${vy.toFixed(3)}" z="${vz.toFixed(3)}" />\n`;
            }
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            for (const [t1, t2, t3] of triangles) {
                xml += `          <triangle v1="${t1}" v2="${t2}" v3="${t3}" pid="1" p1="${colorIndex}" />\n`;
            }
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
            objectId++;
        }
    }
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all objects to the build
    for (let i = 2; i < objectId; i++) {
        xml += `    <item objectid="${i}" />\n`;
    }
    
    xml += '  </build>\n';
    xml += '</model>\n';
    
    // Create 3MF file (which is a ZIP archive)
    await create3MFArchive(xml, settings.filename);
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const pitchMm = settings.pitch;
    const heightMm = settings.height;
    
    // Load JSZip
    await loadJSZip();
    
    const zip = new (window as any).JSZip();
    
    // Create one image per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex].target;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color is
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        zip.file(`${sanitizeFilename(color.name)}.png`, blob);
    }
    
    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Each color layer is represented as a heightmap

`;
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex].target;
        const filename = sanitizeFilename(color.name);
        
        scadContent += `// ${color.name}\n`;
        scadContent += `color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])\n`;
        scadContent += `  translate([0, 0, ${colorIndex * heightMm}])\n`;
        scadContent += `    scale([${pitchMm}, ${pitchMm}, ${heightMm}])\n`;
        scadContent += `      surface(file = "${filename}.png", center = false, invert = true);\n\n`;
    }
    
    zip.file('model.scad', scadContent);
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, `${settings.filename}-openscad.zip`);
}

async function create3MFArchive(modelXml: string, filename: string) {
    await loadJSZip();
    
    const zip = new (window as any).JSZip();
    
    // 3MF requires specific structure
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);
    
    zip.folder('3D').file('3dmodel.model', modelXml);
    
    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, `${filename}.3mf`);
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_');
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
        await new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
