import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as FileSaver from "file-saver";

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
    pitch: number;
    height: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/xml" });
    FileSaver.saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const zHeight = settings.height;

    let meshId = 1;
    let colorId = 1;
    const colorMap = new Map<string, number>();
    
    // Build color resources
    let colorsXML = '';
    for (const part of partList) {
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove '#'
        if (!colorMap.has(hexColor)) {
            colorMap.set(hexColor, colorId);
            colorsXML += `    <m:color color="#${hexColor}" />\n`;
            colorId++;
        }
    }

    // Build meshes for each color
    let objectsXML = '';
    let componentsXML = '';
    
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const hexColor = colorEntryToHex(part.target).substring(1);
        const colorIdx = colorMap.get(hexColor)!;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = zHeight;

                    const baseIdx = vertexCount;
                    
                    // 8 vertices of the box
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objectsXML += `  <object id="${meshId}" type="model">\n`;
            objectsXML += `    <mesh>\n`;
            objectsXML += `    <vertices>\n`;
            objectsXML += vertices.join('\n') + '\n';
            objectsXML += `    </vertices>\n`;
            objectsXML += `    <triangles>\n`;
            objectsXML += triangles.join('\n') + '\n';
            objectsXML += `    </triangles>\n`;
            objectsXML += `    </mesh>\n`;
            objectsXML += `  </object>\n`;
            
            componentsXML += `    <component objectid="${meshId}" p:UUID="${generateUUID()}" />\n`;
            meshId++;
        }
    }

    const modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <resources>
    <basematerials id="1">
${colorsXML}
    </basematerials>
${objectsXML}
    <object id="${meshId}" type="model">
      <components>
${componentsXML}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${meshId}" />
  </build>
</model>`;

    return modelXML;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    const { width, height, partList, pixels } = image;
    
    // Generate one image per color
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (empty)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList } = image;
    const pitch = settings.pitch;
    const zHeight = settings.height;
    
    let scadCode = `// Generated OpenSCAD file for ${image.width}x${image.height} image\n`;
    scadCode += `// Pitch: ${pitch}mm, Height: ${zHeight}mm\n\n`;
    
    scadCode += `pitch = ${pitch};\n`;
    scadCode += `layer_height = ${zHeight};\n`;
    scadCode += `img_width = ${width};\n`;
    scadCode += `img_height = ${height};\n\n`;
    
    scadCode += `// Helper module to create a layer from a heightmap image\n`;
    scadCode += `module make_layer(filename, color_hex) {\n`;
    scadCode += `  color(color_hex) {\n`;
    scadCode += `    scale([pitch, pitch, layer_height]) {\n`;
    scadCode += `      surface(file = filename, center = false, invert = true);\n`;
    scadCode += `    }\n`;
    scadCode += `  }\n`;
    scadCode += `}\n\n`;
    
    scadCode += `union() {\n`;
    
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        const hexColor = colorEntryToHex(part.target);
        
        scadCode += `  // ${part.target.name} (${hexColor})\n`;
        scadCode += `  make_layer("${filename}", "${hexColor}");\n`;
    }
    
    scadCode += `}\n`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
