import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    pitch: number;
    gridSize: string;
}

export async function makeThreeD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad") {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    // Create a simple 3MF file (XML format)
    // 3MF is a ZIP archive containing XML and 3D model data
    
    const modelXml = generate3MFModelXml(image, settings);
    const contentTypesXml = generate3MFContentTypesXml();
    const relationshipsXml = generate3MFRelationshipsXml();
    
    // Create a simple ZIP manually using blob concatenation
    // For now, we'll create a minimal 3MF by generating the XML and saving it
    // A full implementation would require a ZIP library
    
    // As a basic implementation, save the model as an XML file
    const blob = new Blob([modelXml], { type: "application/xml" });
    saveAs(blob, `${settings.filename}.3mf.xml`);
}

function generate3MFModelXml(image: PartListImage, settings: ThreeDSettings): string {
    const scale = settings.pitch;
    const height = 2; // Height of each bead in mm
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ' +
           'xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" ' +
           'unit="mm">\n';
    xml += '  <resources>\n';
    
    // Define materials (colors)
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove '#'
        xml += `    <m:material id="${idx + 1}" type="matte">\n`;
        xml += `      <m:color color="FF${hex}" />\n`;
        xml += `    </m:material>\n`;
    });
    
    xml += '  </resources>\n';
    xml += '  <objects>\n';
    xml += '    <object id="1" type="model">\n';
    xml += '      <mesh>\n';
    xml += '        <vertices>\n';
    
    // Generate vertices and triangles for each colored pixel
    let vertexId = 0;
    const triangles: string[] = [];
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIdx = image.pixels[y][x];
            
            if (colorIdx !== -1) {
                // Create a cube for this pixel
                const x0 = x * scale;
                const y0 = y * scale;
                const x1 = x0 + scale;
                const y1 = y0 + scale;
                
                // Add 8 vertices for a cube
                const baseVertexId = vertexId;
                xml += `          <vertex x="${x0}" y="${y0}" z="0" />\n`;
                xml += `          <vertex x="${x1}" y="${y0}" z="0" />\n`;
                xml += `          <vertex x="${x1}" y="${y1}" z="0" />\n`;
                xml += `          <vertex x="${x0}" y="${y1}" z="0" />\n`;
                xml += `          <vertex x="${x0}" y="${y0}" z="${height}" />\n`;
                xml += `          <vertex x="${x1}" y="${y0}" z="${height}" />\n`;
                xml += `          <vertex x="${x1}" y="${y1}" z="${height}" />\n`;
                xml += `          <vertex x="${x0}" y="${y1}" z="${height}" />\n`;
                
                // Add triangles for this cube (12 triangles = 2 per face)
                const matId = colorIdx + 1;
                const faces = [
                    // Bottom face
                    [baseVertexId, baseVertexId + 1, baseVertexId + 2],
                    [baseVertexId, baseVertexId + 2, baseVertexId + 3],
                    // Top face
                    [baseVertexId + 4, baseVertexId + 6, baseVertexId + 5],
                    [baseVertexId + 4, baseVertexId + 7, baseVertexId + 6],
                    // Front face
                    [baseVertexId, baseVertexId + 5, baseVertexId + 1],
                    [baseVertexId, baseVertexId + 4, baseVertexId + 5],
                    // Back face
                    [baseVertexId + 2, baseVertexId + 7, baseVertexId + 6],
                    [baseVertexId + 2, baseVertexId + 3, baseVertexId + 7],
                    // Left face
                    [baseVertexId + 3, baseVertexId + 4, baseVertexId + 7],
                    [baseVertexId + 3, baseVertexId, baseVertexId + 4],
                    // Right face
                    [baseVertexId + 1, baseVertexId + 6, baseVertexId + 5],
                    [baseVertexId + 1, baseVertexId + 2, baseVertexId + 6],
                ];
                
                faces.forEach(([v1, v2, v3]) => {
                    triangles.push(
                        `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${matId}" />\n`
                    );
                });
                
                vertexId += 8;
            }
        }
    }
    
    xml += '        </vertices>\n';
    xml += '        <triangles>\n';
    xml += triangles.join('');
    xml += '        </triangles>\n';
    xml += '      </mesh>\n';
    xml += '    </object>\n';
    xml += '  </objects>\n';
    xml += '</model>\n';
    
    return xml;
}

function generate3MFContentTypesXml(): string {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
           '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
           '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n' +
           '  <Default Extension="model" ContentType="application/vnd.ms-3mf.model+xml" />\n' +
           '</Types>\n';
}

function generate3MFRelationshipsXml(): string {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
           '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
           '  <Relationship Id="rel1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="3D/model.model" />\n' +
           '</Relationships>\n';
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    // Generate monochrome images for each color
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    
    const imageDataUrls: Array<{ name: string; dataUrl: string }> = [];
    
    // Generate a mask for each color in the palette
    image.partList.forEach((part, colorIdx) => {
        // Create image data for this color
        const imageData = ctx.createImageData(image.width, image.height);
        const data = imageData.data;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = y * image.width + x;
                const pixelColorIdx = image.pixels[y][x];
                
                if (pixelColorIdx === colorIdx) {
                    // Black pixel
                    data[idx * 4] = 0;
                    data[idx * 4 + 1] = 0;
                    data[idx * 4 + 2] = 0;
                    data[idx * 4 + 3] = 255;
                } else {
                    // White pixel
                    data[idx * 4] = 255;
                    data[idx * 4 + 1] = 255;
                    data[idx * 4 + 2] = 255;
                    data[idx * 4 + 3] = 255;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const pngData = canvas.toDataURL("image/png");
        imageDataUrls.push({
            name: `color_${colorIdx}_${part.symbol}.png`,
            dataUrl: pngData
        });
    });
    
    // Generate OpenSCAD script
    const scadScript = generateOpenSCADScript(image, imageDataUrls, settings);
    
    // Save SCAD script
    const scadBlob = new Blob([scadScript], { type: "text/plain" });
    saveAs(scadBlob, `${settings.filename}.scad`);
    
    // Save PNG images as data URL downloads
    imageDataUrls.forEach((item) => {
        // Convert data URL to blob
        const dataUrl = item.dataUrl;
        const parts = dataUrl.split(',');
        const bstr = atob(parts[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
        const blob = new Blob([u8arr], { type: "image/png" });
        saveAs(blob, item.name);
    });
}

function generateOpenSCADScript(image: PartListImage, imageDataUrls: Array<{ name: string; dataUrl: string }>, settings: ThreeDSettings): string {
    const scale = settings.pitch;
    const height = 2; // Height per color level
    
    let script = '// OpenSCAD script generated by firaga.io\n';
    script += '// 3D visualization of pixel art using heightmaps\n\n';
    script += `// Image dimensions: ${image.width} x ${image.height}\n`;
    script += `// Scale: ${scale}mm per pixel\n`;
    script += `// Total size: ${image.width * scale}mm x ${image.height * scale}mm\n\n`;
    
    // Import surface from each image
    image.partList.forEach((part, idx) => {
        const imageName = imageDataUrls[idx]?.name || `color_${idx}.png`;
        script += `// Color ${idx}: ${part.target.name} (symbol: ${part.symbol})\n`;
        script += `surface_${idx} = surface(file="${imageName}", center=true, invert=true);\n`;
        script += `color_${idx} = [${part.target.r / 255}, ${part.target.g / 255}, ${part.target.b / 255}];\n`;
        script += `scaled_${idx} = scale([${scale}, ${scale}, ${height}]) surface_${idx};\n`;
        script += `translate([0, 0, ${idx * height}])\n`;
        script += `  color(color_${idx})\n`;
        script += `  scaled_${idx};\n\n`;
    });
    
    return script;
}
