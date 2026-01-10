import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export async function generate3MF(image: PartListImage, pitch: number, filename: string): Promise<void> {
    const { xml, rels } = build3MFContent(image, pitch, filename);
    
    // Create a ZIP file with 3MF structure
    const zip = await createZip();
    await zip.file('3D/3dmodel.model', xml);
    await zip.file('_rels/.rels', rels);
    await zip.file('[Content_Types].xml', getContentTypes());
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage, pitch: number, filename: string): { xml: string; rels: string } {
    const baseHeight = 1.0; // Height of each layer in mm
    const pixelSize = pitch / 10; // Convert to mm
    
    let vertexId = 1;
    let triangleOffset = 0;
    const objects: string[] = [];
    const materials: string[] = [];
    
    // Generate material definitions and objects for each color
    image.partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target);
        materials.push(`    <base:displaycolor name="${escapeXml(part.target.name)}" value="${hex}" />`);
        
        // Build mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        
        // Find all pixels of this color and create 3D boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const { verts, tris } = createPixelBox(x, y, pixelSize, baseHeight, localVertexId);
                    vertices.push(...verts);
                    triangles.push(...tris);
                    localVertexId += 8; // Each box has 8 vertices
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${vertexId}" type="model" pid="${colorIndex + 1}" pindex="0">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
            vertexId++;
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(filename)}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, i) => `    <item objectid="${i + 2}" />`).join('\n')}
  </build>
</model>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    return { xml, rels };
}

function createPixelBox(
    x: number, 
    y: number, 
    size: number, 
    height: number, 
    startId: number
): { verts: string[]; tris: string[] } {
    const x0 = x * size;
    const y0 = y * size;
    const x1 = x0 + size;
    const y1 = y0 + size;
    const z0 = 0;
    const z1 = height;
    
    // 8 vertices of a box
    const vertices = [
        `        <vertex x="${x0}" y="${y0}" z="${z0}" />`, // 0
        `        <vertex x="${x1}" y="${y0}" z="${z0}" />`, // 1
        `        <vertex x="${x1}" y="${y1}" z="${z0}" />`, // 2
        `        <vertex x="${x0}" y="${y1}" z="${z0}" />`, // 3
        `        <vertex x="${x0}" y="${y0}" z="${z1}" />`, // 4
        `        <vertex x="${x1}" y="${y0}" z="${z1}" />`, // 5
        `        <vertex x="${x1}" y="${y1}" z="${z1}" />`, // 6
        `        <vertex x="${x0}" y="${y1}" z="${z1}" />`  // 7
    ];
    
    // 12 triangles (2 per face)
    const triangles = [
        // Bottom face
        `        <triangle v1="${startId + 0}" v2="${startId + 2}" v3="${startId + 1}" />`,
        `        <triangle v1="${startId + 0}" v2="${startId + 3}" v3="${startId + 2}" />`,
        // Top face
        `        <triangle v1="${startId + 4}" v2="${startId + 5}" v3="${startId + 6}" />`,
        `        <triangle v1="${startId + 4}" v2="${startId + 6}" v3="${startId + 7}" />`,
        // Front face
        `        <triangle v1="${startId + 0}" v2="${startId + 1}" v3="${startId + 5}" />`,
        `        <triangle v1="${startId + 0}" v2="${startId + 5}" v3="${startId + 4}" />`,
        // Back face
        `        <triangle v1="${startId + 2}" v2="${startId + 3}" v3="${startId + 7}" />`,
        `        <triangle v1="${startId + 2}" v2="${startId + 7}" v3="${startId + 6}" />`,
        // Left face
        `        <triangle v1="${startId + 0}" v2="${startId + 4}" v3="${startId + 7}" />`,
        `        <triangle v1="${startId + 0}" v2="${startId + 7}" v3="${startId + 3}" />`,
        // Right face
        `        <triangle v1="${startId + 1}" v2="${startId + 2}" v3="${startId + 6}" />`,
        `        <triangle v1="${startId + 1}" v2="${startId + 6}" v3="${startId + 5}" />`
    ];
    
    return { verts: vertices, tris: triangles };
}

function getContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Minimal ZIP creation using JSZip (or fallback implementation)
async function createZip(): Promise<any> {
    // Check if JSZip is available
    if (typeof (window as any).JSZip !== 'undefined') {
        return new (window as any).JSZip();
    }
    
    // Fallback: load JSZip from CDN
    await loadJSZip();
    return new (window as any).JSZip();
}

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof (window as any).JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}
