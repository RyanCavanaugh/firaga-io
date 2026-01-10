import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

declare const JSZip: any;

/**
 * Generate a 3MF file with separate material shapes for each color
 */
export async function generate3MF(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file('[Content_Types].xml', generateContentTypes());
    
    const rels = zip.folder('_rels');
    rels.file('.rels', generateRels());
    
    const threeDFolder = zip.folder('3D');
    threeDFolder.file('3dmodel.model', generate3DModel(image));
    
    // Generate and download the zip as .3mf
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${filename}.3mf`);
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

function generate3DModel(image: PartListImage): string {
    const height = 2.0; // Height of each pixel cube in mm
    const pixelSize = 2.5; // Size of each pixel in mm (matching typical bead size)
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((part, index) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove # prefix
        xml += `            <base name="${escapeXml(part.target.name)}" displaycolor="#${color}"/>\n`;
    });
    
    xml += `        </basematerials>\n`;
    
    // Generate mesh objects for each color
    image.partList.forEach((part, partIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        const pixels: Array<[number, number]> = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    pixels.push([x, y]);
                }
            }
        }
        
        if (pixels.length === 0) return;
        
        // Generate vertices and triangles for each pixel
        pixels.forEach(([px, py]) => {
            const baseIndex = vertices.length;
            const x = px * pixelSize;
            const y = py * pixelSize;
            
            // Bottom face vertices (z=0)
            vertices.push([x, y, 0]);
            vertices.push([x + pixelSize, y, 0]);
            vertices.push([x + pixelSize, y + pixelSize, 0]);
            vertices.push([x, y + pixelSize, 0]);
            
            // Top face vertices (z=height)
            vertices.push([x, y, height]);
            vertices.push([x + pixelSize, y, height]);
            vertices.push([x + pixelSize, y + pixelSize, height]);
            vertices.push([x, y + pixelSize, height]);
            
            // Bottom face (2 triangles)
            triangles.push([baseIndex + 0, baseIndex + 2, baseIndex + 1]);
            triangles.push([baseIndex + 0, baseIndex + 3, baseIndex + 2]);
            
            // Top face (2 triangles)
            triangles.push([baseIndex + 4, baseIndex + 5, baseIndex + 6]);
            triangles.push([baseIndex + 4, baseIndex + 6, baseIndex + 7]);
            
            // Side faces (4 sides, 2 triangles each)
            // Front
            triangles.push([baseIndex + 0, baseIndex + 1, baseIndex + 5]);
            triangles.push([baseIndex + 0, baseIndex + 5, baseIndex + 4]);
            // Right
            triangles.push([baseIndex + 1, baseIndex + 2, baseIndex + 6]);
            triangles.push([baseIndex + 1, baseIndex + 6, baseIndex + 5]);
            // Back
            triangles.push([baseIndex + 2, baseIndex + 3, baseIndex + 7]);
            triangles.push([baseIndex + 2, baseIndex + 7, baseIndex + 6]);
            // Left
            triangles.push([baseIndex + 3, baseIndex + 0, baseIndex + 4]);
            triangles.push([baseIndex + 3, baseIndex + 4, baseIndex + 7]);
        });
        
        // Create mesh object
        xml += `        <object id="${partIndex + 2}" type="model">\n`;
        xml += `            <mesh>\n`;
        xml += `                <vertices>\n`;
        vertices.forEach(([x, y, z]) => {
            xml += `                    <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}"/>\n`;
        });
        xml += `                </vertices>\n`;
        xml += `                <triangles>\n`;
        triangles.forEach(([v1, v2, v3]) => {
            xml += `                    <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${partIndex}"/>\n`;
        });
        xml += `                </triangles>\n`;
        xml += `            </mesh>\n`;
        xml += `        </object>\n`;
    });
    
    xml += `    </resources>\n`;
    xml += `    <build>\n`;
    
    // Add all objects to the build
    image.partList.forEach((_, index) => {
        xml += `        <item objectid="${index + 2}"/>\n`;
    });
    
    xml += `    </build>\n`;
    xml += `</model>`;
    
    return xml;
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
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
