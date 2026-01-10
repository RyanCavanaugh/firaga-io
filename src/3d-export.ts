import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as JSZip from "jszip";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
}

export async function export3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip.default();
    
    // Create 3MF model file
    const model = generate3MFModel(image, settings);
    zip.file("3D/3dmodel.model", model);
    
    // Create content types file
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create relationships file
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.file("_rels/.rels", rels);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const pixelSize = 1; // 1mm per pixel
    const pixelHeight = settings.pixelHeight;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((part, index) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `      <base name="${part.target.name}" displaycolor="#${hex}" />\n`;
    });
    
    xml += `    </basematerials>
`;
    
    // Create objects for each color
    image.partList.forEach((part, partIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Add a cube for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
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
            xml += `    <object id="${partIndex + 2}" type="model" materialid="1" materialpid="${partIndex}">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
        }
    });
    
    xml += `  </resources>
  <build>
`;
    
    // Add all objects to the build
    image.partList.forEach((part, partIndex) => {
        xml += `    <item objectid="${partIndex + 2}" />\n`;
    });
    
    xml += `  </build>
</model>`;
    
    return xml;
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip.default();
    
    // Create monochrome PNG for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const pngData = createMonochromePNG(image, partIndex);
        zip.file(`color_${partIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, pngData);
    }
    
    // Create OpenSCAD file
    const scadCode = generateOpenSCADCode(image, settings);
    zip.file("model.scad", scadCode);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function createMonochromePNG(image: PartListImage, partIndex: number): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === partIndex;
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    }) as any;
}

function generateOpenSCADCode(image: PartListImage, settings: ThreeDSettings): string {
    const pixelSize = 1; // 1mm per pixel
    const pixelHeight = settings.pixelHeight;
    
    let code = `// Generated OpenSCAD model from firaga.io
// Image size: ${image.width}x${image.height} pixels

pixel_size = ${pixelSize};
pixel_height = ${pixelHeight};

module color_layer(filename, color) {
    color(color)
    scale([pixel_size, pixel_size, pixel_height])
    surface(file=filename, invert=true, center=false);
}

union() {
`;
    
    image.partList.forEach((part, partIndex) => {
        const hex = colorEntryToHex(part.target);
        // Convert hex to RGB values 0-1
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        const filename = `color_${partIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        code += `    color_layer("${filename}", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]); // ${part.target.name}\n`;
    });
    
    code += `}
`;
    
    return code;
}
