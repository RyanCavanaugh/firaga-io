import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

/**
 * Generates a 3MF (3D Manufacturing Format) file from a PartListImage.
 * Creates a triangle mesh with separate material shapes for each color.
 */
export function generate3MF(image: PartListImage, filename: string): void {
    const pixelHeight = 1.0; // Height of each pixel in the 3D mesh
    const pixelWidth = 1.0;  // Width/depth of each pixel
    
    // Build the 3MF XML structure
    const model = build3MFModel(image, pixelHeight, pixelWidth);
    
    // Create the 3MF package (it's a ZIP file)
    create3MFPackage(model, filename);
}

function build3MFModel(image: PartListImage, pixelHeight: number, pixelWidth: number): string {
    let vertexId = 1;
    let triangleId = 1;
    const resources: string[] = [];
    
    // Create a basematerial group for all colors
    const baseMaterials = image.partList.map((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const rgb = hexToRgb(hex);
        return `    <base name="${escapeXml(entry.target.name)}" displaycolor="${rgb}" />`;
    }).join('\n');
    
    resources.push(`  <basematerials id="1">\n${baseMaterials}\n  </basematerials>`);
    
    // Create mesh objects for each color
    image.partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        
        // Find all pixels of this color and create geometry
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const baseVid = localVertexId;
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices of the cube
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
                    triangles.push(`      <triangle v1="${baseVid}" v2="${baseVid + 2}" v3="${baseVid + 1}" />`);
                    triangles.push(`      <triangle v1="${baseVid}" v2="${baseVid + 3}" v3="${baseVid + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseVid + 4}" v2="${baseVid + 5}" v3="${baseVid + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVid + 4}" v2="${baseVid + 6}" v3="${baseVid + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseVid}" v2="${baseVid + 1}" v3="${baseVid + 5}" />`);
                    triangles.push(`      <triangle v1="${baseVid}" v2="${baseVid + 5}" v3="${baseVid + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseVid + 2}" v2="${baseVid + 3}" v3="${baseVid + 7}" />`);
                    triangles.push(`      <triangle v1="${baseVid + 2}" v2="${baseVid + 7}" v3="${baseVid + 6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseVid + 3}" v2="${baseVid}" v3="${baseVid + 4}" />`);
                    triangles.push(`      <triangle v1="${baseVid + 3}" v2="${baseVid + 4}" v3="${baseVid + 7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseVid + 1}" v2="${baseVid + 2}" v3="${baseVid + 6}" />`);
                    triangles.push(`      <triangle v1="${baseVid + 1}" v2="${baseVid + 6}" v3="${baseVid + 5}" />`);
                    
                    localVertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = colorIdx + 2; // Start from 2 (1 is basematerials)
            const mesh = `  <object id="${meshId}" type="model" name="${escapeXml(entry.target.name)}">
    <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
    </mesh>
  </object>`;
            resources.push(mesh);
        }
    });
    
    // Build items (instances of objects)
    const items = image.partList.map((entry, idx) => {
        const meshId = idx + 2;
        const matIdx = idx;
        return `    <item objectid="${meshId}" partnumber="${meshId - 1}" />`;
    }).filter((_, idx) => {
        // Only include items that have geometry
        const colorIdx = idx;
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) return true;
            }
        }
        return false;
    }).join('\n');
    
    // Complete 3MF model XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${items}
  </build>
</model>`;
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "#808080";
    return `#${result[1]}${result[2]}${result[3]}`.toUpperCase();
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

async function create3MFPackage(modelXml: string, filename: string): Promise<void> {
    // For browser compatibility, we'll use a library to create the ZIP
    // We need to dynamically load JSZip
    const JSZip = await loadJSZip();
    
    const zip = new JSZip();
    
    // Add required 3MF files
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    zip.folder('_rels')!.file('.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);
    
    zip.folder('3D')!.file('3dmodel.model', modelXml);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}.3mf`);
}

function loadJSZip(): Promise<typeof import('jszip')> {
    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('jszip-script');
        if (existingScript) {
            resolve((window as any).JSZip);
            return;
        }
        
        const script = document.createElement('script');
        script.id = 'jszip-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
