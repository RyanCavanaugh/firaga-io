import { PartListImage } from "./image-utils";

declare const JSZip: any;
declare const saveAs: any;

export interface Export3DSettings {
    format: "3mf" | "openscad";
    filename: string;
    heightPerLayer: number;
    baseHeight: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    // Load dependencies if needed
    await loadDependencies();
    
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function loadDependencies() {
    // Load JSZip if not already loaded
    if (typeof JSZip === 'undefined') {
        await loadScript('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }
    
    // Load FileSaver if not already loaded
    if (typeof saveAs === 'undefined') {
        await loadScript('filesaver', 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
    }
}

async function loadScript(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    // Create the 3MF model XML
    const modelXml = generate3MFModel(image, settings);
    zip.file("3D/3dmodel.model", modelXml);
    
    // Create content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0"/>
</Relationships>`;
    zip.file("_rels/.rels", rels);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList } = image;
    const { heightPerLayer, baseHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;
    
    // Define materials for each color
    partList.forEach((part, idx) => {
        const color = part.target;
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        xml += `            <base name="${color.name}" displaycolor="#${r}${g}${b}" />\n`;
    });
    
    xml += `        </basematerials>\n`;
    
    // Create mesh objects for each color layer
    partList.forEach((part, partIndex) => {
        const meshId = partIndex + 2;
        xml += `        <object id="${meshId}" type="model" name="${part.target.name}">\n`;
        xml += `            <mesh>\n`;
        xml += `                <vertices>\n`;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate mesh for this color layer
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const z = baseHeight + partIndex * heightPerLayer;
                    const zTop = z + heightPerLayer;
                    
                    // Add 8 vertices for the box
                    const v0 = vertexCount++;
                    vertices.push(`                    <vertex x="${x}" y="${y}" z="${z}" />`);
                    vertices.push(`                    <vertex x="${x + 1}" y="${y}" z="${z}" />`);
                    vertices.push(`                    <vertex x="${x + 1}" y="${y + 1}" z="${z}" />`);
                    vertices.push(`                    <vertex x="${x}" y="${y + 1}" z="${z}" />`);
                    vertices.push(`                    <vertex x="${x}" y="${y}" z="${zTop}" />`);
                    vertices.push(`                    <vertex x="${x + 1}" y="${y}" z="${zTop}" />`);
                    vertices.push(`                    <vertex x="${x + 1}" y="${y + 1}" z="${zTop}" />`);
                    vertices.push(`                    <vertex x="${x}" y="${y + 1}" z="${zTop}" />`);
                    vertexCount += 7;
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`                    <triangle v1="${v0}" v2="${v0 + 2}" v3="${v0 + 1}" p1="${partIndex}" />`);
                    triangles.push(`                    <triangle v1="${v0}" v2="${v0 + 3}" v3="${v0 + 2}" p1="${partIndex}" />`);
                    // Top face
                    triangles.push(`                    <triangle v1="${v0 + 4}" v2="${v0 + 5}" v3="${v0 + 6}" p1="${partIndex}" />`);
                    triangles.push(`                    <triangle v1="${v0 + 4}" v2="${v0 + 6}" v3="${v0 + 7}" p1="${partIndex}" />`);
                    // Front face
                    triangles.push(`                    <triangle v1="${v0}" v2="${v0 + 1}" v3="${v0 + 5}" p1="${partIndex}" />`);
                    triangles.push(`                    <triangle v1="${v0}" v2="${v0 + 5}" v3="${v0 + 4}" p1="${partIndex}" />`);
                    // Back face
                    triangles.push(`                    <triangle v1="${v0 + 2}" v2="${v0 + 3}" v3="${v0 + 7}" p1="${partIndex}" />`);
                    triangles.push(`                    <triangle v1="${v0 + 2}" v2="${v0 + 7}" v3="${v0 + 6}" p1="${partIndex}" />`);
                    // Left face
                    triangles.push(`                    <triangle v1="${v0 + 3}" v2="${v0}" v3="${v0 + 4}" p1="${partIndex}" />`);
                    triangles.push(`                    <triangle v1="${v0 + 3}" v2="${v0 + 4}" v3="${v0 + 7}" p1="${partIndex}" />`);
                    // Right face
                    triangles.push(`                    <triangle v1="${v0 + 1}" v2="${v0 + 2}" v3="${v0 + 6}" p1="${partIndex}" />`);
                    triangles.push(`                    <triangle v1="${v0 + 1}" v2="${v0 + 6}" v3="${v0 + 5}" p1="${partIndex}" />`);
                }
            }
        }
        
        xml += vertices.join('\n') + '\n';
        xml += `                </vertices>\n`;
        xml += `                <triangles>\n`;
        xml += triangles.join('\n') + '\n';
        xml += `                </triangles>\n`;
        xml += `            </mesh>\n`;
        xml += `        </object>\n`;
    });
    
    xml += `    </resources>\n`;
    xml += `    <build>\n`;
    
    // Add all objects to the build
    partList.forEach((part, idx) => {
        const objId = idx + 2;
        xml += `        <item objectid="${objId}" />\n`;
    });
    
    xml += `    </build>\n`;
    xml += `</model>`;
    
    return xml;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    const { width, height, partList } = image;
    
    // Generate a monochrome PNG for each color
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isSet = image.pixels[y][x] === partIndex;
                const value = isSet ? 255 : 0;
                
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`layer_${partIndex}_${safeName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadCode = generateOpenSCADCode(image, settings);
    zip.file(`${settings.filename}.scad`, scadCode);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADCode(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList } = image;
    const { heightPerLayer, baseHeight } = settings;
    
    let code = `// Generated OpenSCAD file for ${settings.filename}
// Image dimensions: ${width}x${height}
// Colors: ${partList.length}

`;
    
    // Add color definitions as comments
    code += `// Color layers:\n`;
    partList.forEach((part, idx) => {
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        code += `//   ${idx}: ${part.target.name} (${part.count} pixels)\n`;
    });
    
    code += `\n// Parameters\n`;
    code += `pixel_width = 1;\n`;
    code += `pixel_height = 1;\n`;
    code += `layer_height = ${heightPerLayer};\n`;
    code += `base_height = ${baseHeight};\n`;
    code += `image_width = ${width};\n`;
    code += `image_height = ${height};\n\n`;
    
    code += `// Main assembly\n`;
    code += `union() {\n`;
    
    partList.forEach((part, idx) => {
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        code += `    // Layer ${idx}: ${part.target.name}\n`;
        code += `    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        code += `    translate([0, 0, base_height + ${idx} * layer_height])\n`;
        code += `    scale([pixel_width, pixel_height, layer_height])\n`;
        code += `    surface(file = "layer_${idx}_${safeName}.png", center = false, invert = true);\n\n`;
    });
    
    code += `}\n`;
    
    return code;
}
