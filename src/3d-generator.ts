import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    filename: string;
    pitch: number;
    height: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad") {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Load JSZip if needed
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Add required 3MF files
    zip.file("[Content_Types].xml", generateContentTypes());
    
    const relsFolder = zip.folder("_rels");
    relsFolder!.file(".rels", generateRels());
    
    const modelFolder = zip.folder("3D");
    modelFolder!.file("3dmodel.model", generate3DModel(image, settings));
    
    // Generate and download the 3MF file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + ".3mf");
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3DModel(image: PartListImage, settings: ThreeDSettings): string {
    const pitch = settings.pitch;
    const height = settings.height;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target);
        xml += `\n            <base name="${part.target.name}" displaycolor="${color.replace('#', '')}FF"/>`;
    });
    
    xml += `\n        </basematerials>`;
    
    // Create a mesh object for each color
    image.partList.forEach((part, materialIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels with this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the cube
                    const baseVertex = vertexCount;
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
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseVertex + 2}" v2="${baseVertex + 3}" v3="${baseVertex + 7}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseVertex + 3}" v2="${baseVertex + 0}" v3="${baseVertex + 4}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex + 7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}"/>`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `\n        <object id="${materialIdx + 2}" type="model">
            <mesh>
                <vertices>
${vertices.map(v => '                    ' + v).join('\n')}
                </vertices>
                <triangles>
${triangles.map(t => '                    ' + t).join('\n')}
                </triangles>
            </mesh>
        </object>`;
        }
    });
    
    xml += `\n    </resources>
    <build>`;
    
    // Add build items for each object
    image.partList.forEach((part, idx) => {
        xml += `\n        <item objectid="${idx + 2}" partnumber="${idx}"/>`;
    });
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZip();
    
    const zip = new JSZip();
    const pitch = settings.pitch;
    const height = settings.height;
    
    // Generate one black/white image per color
    image.partList.forEach((part, idx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        zip.file(`color_${idx}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel pitch: ${pitch}mm
// Height: ${height}mm

`;
    
    image.partList.forEach((part, idx) => {
        const colorHex = colorEntryToHex(part.target);
        scadContent += `
// ${part.target.name} (${part.count} pixels)
color("${colorHex}")
    translate([0, 0, ${idx * height}])
    surface(file = "color_${idx}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png", 
            center = false, 
            invert = true);
`;
    });
    
    scadContent += `
// Alternative: Combine all layers into one
/*
union() {
`;
    
    image.partList.forEach((part, idx) => {
        const colorHex = colorEntryToHex(part.target);
        scadContent += `    color("${colorHex}")
        linear_extrude(height = ${height})
        scale([${pitch}, ${pitch}, 1])
        surface(file = "color_${idx}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png", 
                center = false, 
                invert = true);
`;
    });
    
    scadContent += `}
*/`;
    
    zip.file("model.scad", scadContent);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + "_openscad.zip");
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
