import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface Export3DSettings {
    format: "3mf" | "openscad";
    layerHeight: number;
    pixelSize: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else if (settings.format === "openscad") {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    await loadJSZip();

    const zip = new JSZip();
    
    // Create the 3MF package structure
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
    
    zip.folder("_rels").file(".rels", rels);
    
    // Generate the 3D model
    const modelXml = generate3DModel(image, settings);
    zip.folder("3D").file("3dmodel.model", modelXml);
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

function generate3DModel(image: PartListImage, settings: Export3DSettings): string {
    const { pixelSize, layerHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `\n      <base name="${color.name}" displaycolor="#${hexColor}"/>`;
    }
    
    xml += `\n    </basematerials>`;
    
    // Create mesh objects for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const meshId = colorIdx + 2;
        xml += `\n    <object id="${meshId}" type="model">
      <mesh>
        <vertices>`;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box (rectangular prism) for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = layerHeight;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexIndex;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}"/>`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 2}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 3}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}"/>`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        xml += `\n          ${vertices.join('\n          ')}`;
        xml += `\n        </vertices>
        <triangles>`;
        xml += `\n          ${triangles.join('\n          ')}`;
        xml += `\n        </triangles>
      </mesh>
    </object>`;
    }
    
    xml += `\n  </resources>
  <build>`;
    
    // Add all colored objects to the build
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const meshId = colorIdx + 2;
        xml += `\n    <item objectid="${meshId}" partnumber="${colorIdx}"/>`;
    }
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one PNG image per color (black and white masks)
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
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
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const colorName = image.partList[colorIdx].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${colorIdx}_${colorName}.png`, base64Data, { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_model.zip");
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { pixelSize, layerHeight } = settings;
    
    let scad = `// Generated OpenSCAD file for pixel art
// Image dimensions: ${image.width} x ${image.height}
// Pixel size: ${pixelSize}mm
// Layer height: ${layerHeight}mm

`;
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx].target;
        const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scad += `// ${color.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([${pixelSize}, ${pixelSize}, ${layerHeight}])
    surface(file = "mask_${colorIdx}_${colorName}.png", center = false, invert = true);

`;
    }
    
    return scad;
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve();
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
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
