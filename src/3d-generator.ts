import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
    filename: string;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZipAnd(() => generate3DWorker(image, settings));
}

async function loadJSZipAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

async function generate3DWorker(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // 3MF files are ZIP archives with specific structure
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    
    zip.file("_rels/.rels", rels);
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    zip.file("[Content_Types].xml", contentTypes);
    
    // Generate the 3D model
    const model = generate3MFModel(image, settings);
    zip.file("3D/3dmodel.model", model);
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const pixelSize = settings.pitch;
    const baseHeight = settings.height;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hexColor = colorEntryToHex(part.target);
        const color = hexColor.substring(1); // Remove #
        xml += `
      <base name="${part.target.name}" displaycolor="#${color}" />`;
    });
    
    xml += `
    </basematerials>`;
    
    // Create objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseHeight;
                    
                    // Add 8 vertices for the box
                    const v0 = vertexCount++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    const v1 = vertexCount++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    const v2 = vertexCount++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    const v3 = vertexCount++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    const v4 = vertexCount++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    const v5 = vertexCount++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    const v6 = vertexCount++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    const v7 = vertexCount++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                    // Top
                    triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                    // Front
                    triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                    // Back
                    triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                    // Left
                    triangles.push(`      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`);
                    // Right
                    triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `
    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `
  </resources>
  <build>`;
    
    // Add all objects to build
    image.partList.forEach((part, colorIdx) => {
        // Only add if there are pixels of this color
        let hasPixels = false;
        for (let y = 0; y < image.height && !hasPixels; y++) {
            for (let x = 0; x < image.width && !hasPixels; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    hasPixels = true;
                }
            }
        }
        
        if (hasPixels) {
            xml += `
    <item objectid="${colorIdx + 2}" />`;
        }
    });
    
    xml += `
  </build>
</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const pixelSize = settings.pitch;
    const baseHeight = settings.height;
    
    // Generate one PNG per color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        
        // Clear canvas
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
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        // Sanitize filename
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`color_${colorIdx}_${safeName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    let scadCode = `// Generated 3D model from firaga.io
// Pixel size: ${pixelSize}mm, Height: ${baseHeight}mm

`;
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hexColor = colorEntryToHex(part.target);
        
        scadCode += `// ${part.target.name} (${hexColor})
color("${hexColor}")
  scale([${pixelSize}, ${pixelSize}, ${baseHeight}])
    surface(file = "color_${colorIdx}_${safeName}.png", center = true, invert = true);

`;
    }
    
    zip.file(`${settings.filename}.scad`, scadCode);
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
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
