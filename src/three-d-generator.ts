import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pegHeight: number;
    baseThickness: number;
    pitch: number;
}

/**
 * Generate and download 3D output in the selected format
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const materials: Array<{ id: number; color: string; name: string }> = [];
    const objects: string[] = [];
    const objectIds: number[] = [];
    
    // Build material definitions
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove '#'
        materials.push({
            id: idx + 1,
            color: hex,
            name: part.target.name
        });
    });

    // Build geometry for each color
    let objectId = 2; // Start after basematerials id=1
    image.partList.forEach((part, materialIdx) => {
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
        let vertexOffset = 0;
        
        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    addPegMesh(x, y, settings.pitch, settings.pegHeight, settings.baseThickness, 
                               vertices, triangles, vertexOffset);
                    vertexOffset = vertices.length;
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(buildMeshXML(vertices, triangles, objectId, materialIdx));
            objectIds.push(objectId);
            objectId++;
        }
    });

    const xml = build3MFDocument(materials, objects, objectIds);
    downloadFile(xml, `${settings.filename}.3mf`, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

/**
 * Add mesh geometry for a single peg
 */
function addPegMesh(
    x: number, 
    y: number, 
    pitch: number, 
    pegHeight: number, 
    baseThickness: number,
    vertices: Array<{ x: number; y: number; z: number }>,
    triangles: Array<{ v1: number; v2: number; v3: number }>,
    offset: number
): void {
    const px = x * pitch;
    const py = y * pitch;
    const hw = pitch / 2; // half width
    
    // Simple box for each peg (8 vertices, 12 triangles)
    const baseVerts = [
        { x: px - hw, y: py - hw, z: 0 },
        { x: px + hw, y: py - hw, z: 0 },
        { x: px + hw, y: py + hw, z: 0 },
        { x: px - hw, y: py + hw, z: 0 },
        { x: px - hw, y: py - hw, z: pegHeight + baseThickness },
        { x: px + hw, y: py - hw, z: pegHeight + baseThickness },
        { x: px + hw, y: py + hw, z: pegHeight + baseThickness },
        { x: px - hw, y: py + hw, z: pegHeight + baseThickness }
    ];
    
    vertices.push(...baseVerts);
    
    const base = offset;
    // Bottom face
    triangles.push({ v1: base + 0, v2: base + 1, v3: base + 2 });
    triangles.push({ v1: base + 0, v2: base + 2, v3: base + 3 });
    // Top face
    triangles.push({ v1: base + 4, v2: base + 6, v3: base + 5 });
    triangles.push({ v1: base + 4, v2: base + 7, v3: base + 6 });
    // Sides
    triangles.push({ v1: base + 0, v2: base + 4, v3: base + 5 });
    triangles.push({ v1: base + 0, v2: base + 5, v3: base + 1 });
    triangles.push({ v1: base + 1, v2: base + 5, v3: base + 6 });
    triangles.push({ v1: base + 1, v2: base + 6, v3: base + 2 });
    triangles.push({ v1: base + 2, v2: base + 6, v3: base + 7 });
    triangles.push({ v1: base + 2, v2: base + 7, v3: base + 3 });
    triangles.push({ v1: base + 3, v2: base + 7, v3: base + 4 });
    triangles.push({ v1: base + 3, v2: base + 4, v3: base + 0 });
}

/**
 * Build mesh XML for a single object
 */
function buildMeshXML(
    vertices: Array<{ x: number; y: number; z: number }>,
    triangles: Array<{ v1: number; v2: number; v3: number }>,
    objectId: number,
    materialIdx: number
): string {
    let xml = `    <object id="${objectId}" type="model">\n`;
    xml += `      <mesh>\n`;
    xml += `        <vertices>\n`;
    vertices.forEach(v => {
        xml += `          <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}" />\n`;
    });
    xml += `        </vertices>\n`;
    xml += `        <triangles>\n`;
    triangles.forEach(t => {
        xml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" p1="${materialIdx}" p2="${materialIdx}" p3="${materialIdx}" pid="1" />\n`;
    });
    xml += `        </triangles>\n`;
    xml += `      </mesh>\n`;
    xml += `    </object>\n`;
    return xml;
}

/**
 * Build complete 3MF XML document
 */
function build3MFDocument(
    materials: Array<{ id: number; color: string; name: string }>,
    objects: string[],
    objectIds: number[]
): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">\n';
    xml += '  <resources>\n';
    
    // Material definitions
    xml += '    <basematerials id="1">\n';
    materials.forEach(mat => {
        xml += `      <base name="${escapeXML(mat.name)}" displaycolor="#${mat.color}" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Objects
    objects.forEach(obj => {
        xml += obj;
    });
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    objectIds.forEach(id => {
        xml += `    <item objectid="${id}" />\n`;
    });
    xml += '  </build>\n';
    xml += '</model>\n';
    
    return xml;
}

/**
 * Generate OpenSCAD masks format (zip with images + .scad file)
 */
function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): void {
    // This would require a ZIP library. For now, we'll generate the files separately
    // In a full implementation, use JSZip or similar
    
    const files: Array<{ name: string; content: Blob }> = [];
    
    // Generate one black/white image per color
    image.partList.forEach((part, idx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        // Fill white background
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
        
        canvas.toBlob(blob => {
            if (blob) {
                files.push({ 
                    name: `color_${idx}_${sanitizeFilename(part.target.name)}.png`, 
                    content: blob 
                });
            }
        });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    files.push({ 
        name: `${settings.filename}.scad`, 
        content: new Blob([scadContent], { type: "text/plain" }) 
    });
    
    // For simplicity, download files individually
    // In production, would create a ZIP
    setTimeout(() => {
        files.forEach(file => {
            downloadFile(file.content, file.name, file.content.type);
        });
    }, 100);
}

/**
 * Generate OpenSCAD file content
 */
function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    let scad = "// Generated by firaga.io\n";
    scad += "// OpenSCAD heightmap-based 3D visualization\n\n";
    scad += `pitch = ${settings.pitch};\n`;
    scad += `peg_height = ${settings.pegHeight};\n`;
    scad += `base_thickness = ${settings.baseThickness};\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;
    
    image.partList.forEach((part, idx) => {
        const filename = `color_${idx}_${sanitizeFilename(part.target.name)}.png`;
        const hex = colorEntryToHex(part.target);
        scad += `// ${part.target.name} (${hex})\n`;
        scad += `color("${hex}") {\n`;
        scad += `  surface(file = "${filename}", center = true, invert = true);\n`;
        scad += `}\n\n`;
    });
    
    return scad;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Download file to user's computer
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = typeof content === "string" 
        ? new Blob([content], { type: mimeType }) 
        : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
