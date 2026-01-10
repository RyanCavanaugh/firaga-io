import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Add 3MF metadata
    zip.file("[Content_Types].xml", generate3MFContentTypes());
    
    const relsFolder = zip.folder("_rels");
    relsFolder.file(".rels", generate3MFRels());
    
    const modelFolder = zip.folder("3D");
    modelFolder.file("3dmodel.model", generate3MFModel(image, settings));
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generate3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generate3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const color = hex.slice(1); // Remove #
        xml += `
            <base name="${escapeXml(part.target.name)}" displaycolor="#${color}FF"/>`;
    });
    
    xml += `
        </basematerials>`;
    
    // Generate mesh for each color
    partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Collect all pixels for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    // Create a cube for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    const vStart = vertexCount;
                    
                    // 8 vertices of the cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    vertexCount += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push(`<triangle v1="${vStart + 0}" v2="${vStart + 2}" v3="${vStart + 1}"/>`);
                    triangles.push(`<triangle v1="${vStart + 0}" v2="${vStart + 3}" v3="${vStart + 2}"/>`);
                    // Top
                    triangles.push(`<triangle v1="${vStart + 4}" v2="${vStart + 5}" v3="${vStart + 6}"/>`);
                    triangles.push(`<triangle v1="${vStart + 4}" v2="${vStart + 6}" v3="${vStart + 7}"/>`);
                    // Front
                    triangles.push(`<triangle v1="${vStart + 0}" v2="${vStart + 1}" v3="${vStart + 5}"/>`);
                    triangles.push(`<triangle v1="${vStart + 0}" v2="${vStart + 5}" v3="${vStart + 4}"/>`);
                    // Back
                    triangles.push(`<triangle v1="${vStart + 2}" v2="${vStart + 3}" v3="${vStart + 7}"/>`);
                    triangles.push(`<triangle v1="${vStart + 2}" v2="${vStart + 7}" v3="${vStart + 6}"/>`);
                    // Left
                    triangles.push(`<triangle v1="${vStart + 3}" v2="${vStart + 0}" v3="${vStart + 4}"/>`);
                    triangles.push(`<triangle v1="${vStart + 3}" v2="${vStart + 4}" v3="${vStart + 7}"/>`);
                    // Right
                    triangles.push(`<triangle v1="${vStart + 1}" v2="${vStart + 2}" v3="${vStart + 6}"/>`);
                    triangles.push(`<triangle v1="${vStart + 1}" v2="${vStart + 6}" v3="${vStart + 5}"/>`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `
        <object id="${partIdx + 2}" type="model">
            <mesh>
                <vertices>
                    ${vertices.join('\n                    ')}
                </vertices>
                <triangles>
                    ${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`;
        }
    });
    
    xml += `
    </resources>
    <build>`;
    
    // Add each mesh object to the build
    partList.forEach((part, partIdx) => {
        xml += `
        <item objectid="${partIdx + 2}" partnumber="${partIdx}"/>`;
    });
    
    xml += `
    </build>
</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Generate one monochrome PNG per color
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const colorName = sanitizeFilename(part.target.name);
        zip.file(`color_${partIdx}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image size: ${width}x${height}

// Parameters
pixel_width = 1;  // Width of each pixel in mm
pixel_height = ${pixelHeight};  // Height of each pixel above base in mm
base_height = ${baseHeight};  // Height of base in mm

module color_layer(image_file, color) {
    color(color)
    linear_extrude(height = pixel_height)
    scale([pixel_width, pixel_width, 1])
    surface(file = image_file, center = false, invert = true);
}

// Base layer
color([0.8, 0.8, 0.8])
cube([${width}, ${height}, base_height]);

// Color layers
translate([0, 0, base_height]) {
`;
    
    partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const r = (parseInt(hex.slice(1, 3), 16) / 255).toFixed(3);
        const g = (parseInt(hex.slice(3, 5), 16) / 255).toFixed(3);
        const b = (parseInt(hex.slice(5, 7), 16) / 255).toFixed(3);
        const colorName = sanitizeFilename(part.target.name);
        
        scadContent += `    color_layer("color_${idx}_${colorName}.png", [${r}, ${g}, ${b}]); // ${part.target.name}\n`;
    });
    
    scadContent += `}
`;
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
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
    if (typeof JSZip !== 'undefined') {
        return;
    }
    
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}
