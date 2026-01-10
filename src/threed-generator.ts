import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { Export3DSettings } from "./components/export-3d-dialog";

declare const JSZip: any;

export async function make3MF(image: PartListImage, settings: Export3DSettings) {
    // Load JSZip library
    await loadLibrary("jszip-script-tag", "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    
    const zip = new JSZip();
    
    // Generate 3MF file content
    const content3mf = generate3MFContent(image, settings);
    const relsContent = generate3MFRels();
    const contentTypesContent = generate3MFContentTypes();
    
    // Add files to ZIP
    zip.file("3D/3dmodel.model", content3mf);
    zip.file("_rels/.rels", relsContent);
    zip.file("[Content_Types].xml", contentTypesContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

export async function makeOpenSCADMasks(image: PartListImage, settings: Export3DSettings) {
    // Load JSZip library
    await loadLibrary("jszip-script-tag", "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    
    const zip = new JSZip();
    
    // Generate one mask image per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImage = generateMaskImage(image, i);
        zip.file(`mask_${i}_${sanitizeFilename(part.target.name)}.png`, maskImage.split(',')[1], { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const pixelHeight = 1.0; // Height of each pixel in mm
    const pixelWidth = settings.pitch; // Width/depth of each pixel
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, i) => {
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRGB(hex);
        xml += `
      <base name="${escapeXml(part.target.name)}" displaycolor="${rgb}" />`;
    });
    
    xml += `
    </basematerials>`;
    
    // Generate mesh objects for each color
    image.partList.forEach((part, materialIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIndex) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // Add 8 vertices for a cube
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // Add 12 triangles (2 per face, 6 faces)
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
            xml += `
    <object id="${materialIndex + 2}" type="model">
      <mesh>
        <vertices>`;
            
            vertices.forEach(v => {
                xml += `
          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`;
            });
            
            xml += `
        </vertices>
        <triangles>`;
            
            triangles.forEach(t => {
                xml += `
          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${materialIndex}" />`;
            });
            
            xml += `
        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `
  </resources>
  <build>`;
    
    // Add all objects to build
    image.partList.forEach((part, i) => {
        xml += `
    <item objectid="${i + 2}" />`;
    });
    
    xml += `
  </build>
</model>`;
    
    return xml;
}

function generate3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function generate3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function generateMaskImage(image: PartListImage, partIndex: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, image.width, image.height);
    
    // Draw black pixels for this color
    ctx.fillStyle = '#000000';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    return canvas.toDataURL('image/png');
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const pixelSize = settings.pitch;
    const height = 1.0; // Height of each layer
    
    let scad = `// Generated by firaga.io
// Image: ${settings.filename}
// Size: ${image.width}x${image.height}

pixel_size = ${pixelSize};
layer_height = ${height};
image_width = ${image.width};
image_height = ${image.height};

`;
    
    // Generate module for each color
    image.partList.forEach((part, i) => {
        const filename = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        const hex = colorEntryToHex(part.target);
        
        scad += `// Color: ${part.target.name} (${hex})
module layer_${i}() {
    color("${hex}")
    scale([pixel_size, pixel_size, layer_height])
    surface(file = "${filename}", center = true, invert = true);
}

`;
    });
    
    // Combine all layers
    scad += `// Combine all layers
union() {
`;
    
    image.partList.forEach((part, i) => {
        scad += `    translate([0, 0, ${i * height}]) layer_${i}();\n`;
    });
    
    scad += `}
`;
    
    return scad;
}

function hexToRGB(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${hex.slice(1).toUpperCase()}`;
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
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
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

async function loadLibrary(tagName: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const scriptEl = document.getElementById(tagName);
        if (scriptEl !== null) {
            resolve();
        } else {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error(`Failed to load ${src}`));
            tag.src = src;
            document.head.appendChild(tag);
        }
    });
}
