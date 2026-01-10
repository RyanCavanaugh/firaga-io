import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

/**
 * Generate a 3MF file (3D Manufacturing Format) containing a triangle mesh
 * with separate material shapes for each color in the image.
 * 
 * 3MF files are ZIP archives containing XML model files.
 */
export async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    await loadJSZip();
    
    const { height: pixelHeight = 1, baseThickness = 0.5 } = settings;
    
    // Build XML for 3MF format
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, index) => {
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <base:material id="${index + 1}" name="${part.target.name}" color="#${hexColor}FF" />`);
    });
    
    // Create mesh objects for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: Array<readonly [number, number, number]> = [];
        const triangles: Array<readonly [number, number, number]> = [];
        
        // Collect all pixels of this color
        const pixels: Array<readonly [number, number]> = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelColorIndex = image.pixels[y][x];
                if (pixelColorIndex === colorIndex) {
                    pixels.push([x, y] as const);
                }
            }
        }
        
        if (pixels.length === 0) return;
        
        // For each pixel, create a rectangular prism (box)
        pixels.forEach(([px, py]) => {
            const x = px;
            const y = py;
            const z = 0;
            
            const baseIdx = vertices.length;
            
            // Bottom face vertices (4 vertices)
            vertices.push([x, y, z] as const);
            vertices.push([x + 1, y, z] as const);
            vertices.push([x + 1, y + 1, z] as const);
            vertices.push([x, y + 1, z] as const);
            
            // Top face vertices (4 vertices)
            vertices.push([x, y, z + pixelHeight] as const);
            vertices.push([x + 1, y, z + pixelHeight] as const);
            vertices.push([x + 1, y + 1, z + pixelHeight] as const);
            vertices.push([x, y + 1, z + pixelHeight] as const);
            
            // Bottom face (2 triangles)
            triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1] as const);
            triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2] as const);
            
            // Top face (2 triangles)
            triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6] as const);
            triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7] as const);
            
            // Side faces (8 triangles, 2 per side)
            // Front face (y = 0)
            triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5] as const);
            triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4] as const);
            
            // Right face (x = 1)
            triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6] as const);
            triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5] as const);
            
            // Back face (y = 1)
            triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7] as const);
            triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6] as const);
            
            // Left face (x = 0)
            triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4] as const);
            triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7] as const);
        });
        
        // Build mesh XML
        let meshXml = `    <object id="${colorIndex + 2}" type="model" pid="1" pindex="${colorIndex + 1}">\n`;
        meshXml += `      <mesh>\n`;
        meshXml += `        <vertices>\n`;
        vertices.forEach(([x, y, z]) => {
            meshXml += `          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}" />\n`;
        });
        meshXml += `        </vertices>\n`;
        meshXml += `        <triangles>\n`;
        triangles.forEach(([v1, v2, v3]) => {
            meshXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        });
        meshXml += `        </triangles>\n`;
        meshXml += `      </mesh>\n`;
        meshXml += `    </object>\n`;
        
        objects.push(meshXml);
    });
    
    // Build base plate if needed
    if (baseThickness > 0) {
        const baseIdx = image.partList.length + 2;
        let baseXml = `    <object id="${baseIdx}" type="model">\n`;
        baseXml += `      <mesh>\n`;
        baseXml += `        <vertices>\n`;
        baseXml += `          <vertex x="0" y="0" z="${-baseThickness}" />\n`;
        baseXml += `          <vertex x="${image.width}" y="0" z="${-baseThickness}" />\n`;
        baseXml += `          <vertex x="${image.width}" y="${image.height}" z="${-baseThickness}" />\n`;
        baseXml += `          <vertex x="0" y="${image.height}" z="${-baseThickness}" />\n`;
        baseXml += `          <vertex x="0" y="0" z="0" />\n`;
        baseXml += `          <vertex x="${image.width}" y="0" z="0" />\n`;
        baseXml += `          <vertex x="${image.width}" y="${image.height}" z="0" />\n`;
        baseXml += `          <vertex x="0" y="${image.height}" z="0" />\n`;
        baseXml += `        </vertices>\n`;
        baseXml += `        <triangles>\n`;
        // Bottom
        baseXml += `          <triangle v1="0" v2="2" v3="1" />\n`;
        baseXml += `          <triangle v1="0" v2="3" v3="2" />\n`;
        // Top
        baseXml += `          <triangle v1="4" v2="5" v3="6" />\n`;
        baseXml += `          <triangle v1="4" v2="6" v3="7" />\n`;
        // Sides
        baseXml += `          <triangle v1="0" v2="1" v3="5" />\n`;
        baseXml += `          <triangle v1="0" v2="5" v3="4" />\n`;
        baseXml += `          <triangle v1="1" v2="2" v3="6" />\n`;
        baseXml += `          <triangle v1="1" v2="6" v3="5" />\n`;
        baseXml += `          <triangle v1="2" v2="3" v3="7" />\n`;
        baseXml += `          <triangle v1="2" v2="7" v3="6" />\n`;
        baseXml += `          <triangle v1="3" v2="0" v3="4" />\n`;
        baseXml += `          <triangle v1="3" v2="4" v3="7" />\n`;
        baseXml += `        </triangles>\n`;
        baseXml += `      </mesh>\n`;
        baseXml += `    </object>\n`;
        objects.push(baseXml);
    }
    
    // Build complete 3MF document
    const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${objects.join('')}
  </resources>
  <build>
${objects.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n')}
  </build>
</model>`;
    
    // Create ZIP archive for 3MF
    const zip = new JSZip();
    
    // Add model file
    zip.file('3D/3dmodel.model', model);
    
    // Add content types file (required by 3MF spec)
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file('[Content_Types].xml', contentTypes);
    
    // Add relationships file (required by 3MF spec)
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.file('_rels/.rels', rels);
    
    return zip.generateAsync({ type: 'blob' });
}

async function loadJSZip(): Promise<void> {
    if (typeof JSZip !== 'undefined') {
        return;
    }
    
    const tagName = "jszip-script-tag-3mf";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error('Failed to load JSZip'));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

export interface ThreeDSettings {
    height?: number;
    baseThickness?: number;
}
