import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface Export3DSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings.filename);
    } else {
        await exportOpenSCADMasks(image, settings.filename);
    }
}

// 3MF Format Export
async function export3MF(image: PartListImage, filename: string) {
    const { JSZip } = await import3MFDependencies();
    
    const zip = new JSZip();
    
    // Add 3MF model file
    const modelXml = generate3MFModel(image);
    zip.file("3D/3dmodel.model", modelXml);
    
    // Add content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Add relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.file("_rels/.rels", rels);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, filename + ".3mf");
}

function generate3MFModel(image: PartListImage): string {
    const pixelHeight = 1.0; // Height of each pixel in mm
    const pixelWidth = 2.5; // Width/depth of each pixel in mm (standard mini bead size)
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove '#'
        xml += `\n            <base name="${part.target.name}" displaycolor="#${color}FF"/>`;
    });
    
    xml += `\n        </basematerials>`;
    
    // Generate mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // Add 8 vertices for the box
                    const baseIdx = vertexCount;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    vertexCount += 8;
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+3}" v3="${baseIdx+7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx+3}" v2="${baseIdx+0}" v3="${baseIdx+4}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+3}" v2="${baseIdx+4}" v3="${baseIdx+7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}"/>`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `\n        <object id="${colorIdx + 2}" type="model">
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
    
    // Add build items for each color object
    image.partList.forEach((part, colorIdx) => {
        xml += `\n        <item objectid="${colorIdx + 2}" partnumber="${colorIdx}"/>`;
    });
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

// OpenSCAD Masks Format Export
async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    const { JSZip } = await import3MFDependencies();
    
    const zip = new JSZip();
    
    // Generate one black/white image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const colorName = sanitizeFilename(image.partList[colorIdx].target.name);
        zip.file(`mask_${colorIdx}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file("model.scad", scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, filename + ".zip");
}

function generateOpenSCADFile(image: PartListImage): string {
    const pixelSize = 2.5; // mm
    const pixelHeight = 1.0; // mm
    
    let scad = `// Generated by firaga.io
// OpenSCAD model with heightmap-based color layers

pixel_size = ${pixelSize};
pixel_height = ${pixelHeight};
image_width = ${image.width};
image_height = ${image.height};

// Render all color layers
union() {
`;
    
    image.partList.forEach((part, colorIdx) => {
        const colorName = sanitizeFilename(part.target.name);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scad += `    // ${part.target.name}
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    scale([pixel_size, pixel_size, pixel_height])
    surface(file = "mask_${colorIdx}_${colorName}.png", invert = true, center = true);
    
`;
    });
    
    scad += `}
`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function import3MFDependencies() {
    // Load JSZip from CDN if not already loaded
    const scriptId = "jszip-script";
    if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve) => {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }
    
    return {
        JSZip: (window as any).JSZip
    };
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
