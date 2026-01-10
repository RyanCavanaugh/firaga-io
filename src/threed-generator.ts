import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings.filename);
    } else {
        await generateOpenSCAD(image, settings.filename);
    }
}

async function generate3MF(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const width = image.width;
    const height = image.height;
    const pixelHeight = 1.0;
    
    // Build triangles for each color
    const colorMeshes: { [colorName: string]: { vertices: number[], triangles: number[] } } = {};
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = image.pixels[y][x];
            if (colorIndex === undefined) continue;
            
            const part = image.partList[colorIndex];
            if (!part) continue;
            
            const colorKey = part.target.name;
            if (!colorMeshes[colorKey]) {
                colorMeshes[colorKey] = { vertices: [], triangles: [] };
            }
            
            const mesh = colorMeshes[colorKey];
            const baseIdx = mesh.vertices.length / 3;
            
            // Create a simple box for each pixel
            // Bottom face at z=0, top face at z=pixelHeight
            const x0 = x, x1 = x + 1;
            const y0 = y, y1 = y + 1;
            const z0 = 0, z1 = pixelHeight;
            
            // 8 vertices of the box
            mesh.vertices.push(
                x0, y0, z0,  // 0
                x1, y0, z0,  // 1
                x1, y1, z0,  // 2
                x0, y1, z0,  // 3
                x0, y0, z1,  // 4
                x1, y0, z1,  // 5
                x1, y1, z1,  // 6
                x0, y1, z1   // 7
            );
            
            // 12 triangles (2 per face, 6 faces)
            // Bottom face (z=0)
            mesh.triangles.push(baseIdx+0, baseIdx+2, baseIdx+1);
            mesh.triangles.push(baseIdx+0, baseIdx+3, baseIdx+2);
            // Top face (z=1)
            mesh.triangles.push(baseIdx+4, baseIdx+5, baseIdx+6);
            mesh.triangles.push(baseIdx+4, baseIdx+6, baseIdx+7);
            // Front face (y=0)
            mesh.triangles.push(baseIdx+0, baseIdx+1, baseIdx+5);
            mesh.triangles.push(baseIdx+0, baseIdx+5, baseIdx+4);
            // Back face (y=1)
            mesh.triangles.push(baseIdx+3, baseIdx+7, baseIdx+6);
            mesh.triangles.push(baseIdx+3, baseIdx+6, baseIdx+2);
            // Left face (x=0)
            mesh.triangles.push(baseIdx+0, baseIdx+4, baseIdx+7);
            mesh.triangles.push(baseIdx+0, baseIdx+7, baseIdx+3);
            // Right face (x=1)
            mesh.triangles.push(baseIdx+1, baseIdx+2, baseIdx+6);
            mesh.triangles.push(baseIdx+1, baseIdx+6, baseIdx+5);
        }
    }
    
    // Generate 3MF file
    const xml = create3MFXml(colorMeshes, image);
    
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, filename + ".3mf");
}

function create3MFXml(colorMeshes: { [colorName: string]: { vertices: number[], triangles: number[] } }, image: PartListImage): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;
    
    const colorNames = Object.keys(colorMeshes);
    colorNames.forEach((colorName, idx) => {
        const part = image.partList.find(p => p.target.name === colorName);
        const color = part ? colorEntryToHex(part.target).substring(1) : "808080";
        xml += `      <base name="${escapeXml(colorName)}" displaycolor="#${color}"/>\n`;
    });
    
    xml += `    </basematerials>\n`;
    
    colorNames.forEach((colorName, idx) => {
        const mesh = colorMeshes[colorName];
        const objectId = idx + 2;
        
        xml += `    <object id="${objectId}" type="model">\n`;
        xml += `      <mesh>\n`;
        xml += `        <vertices>\n`;
        
        for (let i = 0; i < mesh.vertices.length; i += 3) {
            xml += `          <vertex x="${mesh.vertices[i]}" y="${mesh.vertices[i+1]}" z="${mesh.vertices[i+2]}"/>\n`;
        }
        
        xml += `        </vertices>\n`;
        xml += `        <triangles>\n`;
        
        for (let i = 0; i < mesh.triangles.length; i += 3) {
            xml += `          <triangle v1="${mesh.triangles[i]}" v2="${mesh.triangles[i+1]}" v3="${mesh.triangles[i+2]}" p1="1" pid1="${idx}"/>\n`;
        }
        
        xml += `        </triangles>\n`;
        xml += `      </mesh>\n`;
        xml += `    </object>\n`;
    });
    
    xml += `  </resources>\n`;
    xml += `  <build>\n`;
    
    colorNames.forEach((_, idx) => {
        xml += `    <item objectid="${idx + 2}"/>\n`;
    });
    
    xml += `  </build>\n`;
    xml += `</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const width = image.width;
    const height = image.height;
    
    const zip = new JSZip();
    
    // Generate one black/white image per color
    const colorImages: { [colorName: string]: ImageData } = {};
    
    for (const part of image.partList) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);
        
        // Fill with white, then mark black where this color appears
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;     // R
            imageData.data[i+1] = 255;   // G
            imageData.data[i+2] = 255;   // B
            imageData.data[i+3] = 255;   // A
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const colorIndex = image.pixels[y][x];
                if (colorIndex !== undefined && image.partList[colorIndex] === part) {
                    const idx = (y * width + x) * 4;
                    imageData.data[idx] = 0;     // R
                    imageData.data[idx+1] = 0;   // G
                    imageData.data[idx+2] = 0;   // B
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));
        const safeColorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${safeColorName}.png`, blob);
        colorImages[safeColorName] = imageData;
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Each color layer is loaded from a separate heightmap image

pixel_size = 1.0;
height_per_layer = 1.0;

`;
    
    image.partList.forEach((part, idx) => {
        const safeColorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = colorEntryToHex(part.target);
        const r = parseInt(color.substring(1, 3), 16) / 255;
        const g = parseInt(color.substring(3, 5), 16) / 255;
        const b = parseInt(color.substring(5, 7), 16) / 255;
        
        scadContent += `// Layer ${idx + 1}: ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${idx} * height_per_layer])
scale([pixel_size, pixel_size, height_per_layer])
surface(file = "${safeColorName}.png", center = false, invert = true);

`;
    });
    
    zip.file("model.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, filename + "_openscad.zip");
}

function escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
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

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl !== null) {
        return;
    }
    
    return new Promise((resolve) => {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => resolve();
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    });
}
