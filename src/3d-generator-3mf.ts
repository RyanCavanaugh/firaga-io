import { PartListImage } from "./image-utils";
const JSZip = require("jszip");

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

export async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create the 3MF file structure
    const modelXml = create3MFModel(image, settings);
    const relsXml = create3MFRels();
    const contentTypesXml = create3MFContentTypes();
    
    zip.file("3D/3dmodel.model", modelXml);
    zip.file("_rels/.rels", relsXml);
    zip.file("[Content_Types].xml", contentTypesXml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function create3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, baseHeight } = settings;
    const pixelSize = 1.0; // 1mm per pixel
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    let objectId = 1;
    const buildItems: string[] = [];
    
    // Create base plate
    const baseVertices: string[] = [];
    const baseTriangles: string[] = [];
    const width = image.width * pixelSize;
    const height = image.height * pixelSize;
    
    // Base vertices (bottom then top)
    baseVertices.push(`    <vertex x="0" y="0" z="0" />`);
    baseVertices.push(`    <vertex x="${width}" y="0" z="0" />`);
    baseVertices.push(`    <vertex x="${width}" y="${height}" z="0" />`);
    baseVertices.push(`    <vertex x="0" y="${height}" z="0" />`);
    baseVertices.push(`    <vertex x="0" y="0" z="${baseHeight}" />`);
    baseVertices.push(`    <vertex x="${width}" y="0" z="${baseHeight}" />`);
    baseVertices.push(`    <vertex x="${width}" y="${height}" z="${baseHeight}" />`);
    baseVertices.push(`    <vertex x="0" y="${height}" z="${baseHeight}" />`);
    
    // Base triangles (box)
    const baseFaces = [
        [0,2,1], [0,3,2], // bottom
        [4,5,6], [4,6,7], // top
        [0,1,5], [0,5,4], // front
        [2,3,7], [2,7,6], // back
        [0,4,7], [0,7,3], // left
        [1,2,6], [1,6,5]  // right
    ];
    
    baseFaces.forEach(face => {
        baseTriangles.push(`    <triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}" />`);
    });
    
    xml += `  <object id="${objectId}" type="model">\n`;
    xml += '   <mesh>\n    <vertices>\n';
    xml += baseVertices.join('\n') + '\n';
    xml += '    </vertices>\n    <triangles>\n';
    xml += baseTriangles.join('\n') + '\n';
    xml += '    </triangles>\n   </mesh>\n  </object>\n';
    buildItems.push(`   <item objectid="${objectId}" />`);
    objectId++;
    
    // Create objects for each color
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        const boxes: Array<{x: number, y: number}> = [];
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    boxes.push({ x, y });
                }
            }
        }
        
        if (boxes.length === 0) continue;
        
        // Create vertices and triangles for each box
        let vertexOffset = 0;
        for (const box of boxes) {
            const x1 = box.x * pixelSize;
            const y1 = box.y * pixelSize;
            const x2 = (box.x + 1) * pixelSize;
            const y2 = (box.y + 1) * pixelSize;
            const z1 = baseHeight;
            const z2 = baseHeight + pixelHeight;
            
            // Add 8 vertices for this box
            vertices.push(`    <vertex x="${x1}" y="${y1}" z="${z1}" />`);
            vertices.push(`    <vertex x="${x2}" y="${y1}" z="${z1}" />`);
            vertices.push(`    <vertex x="${x2}" y="${y2}" z="${z1}" />`);
            vertices.push(`    <vertex x="${x1}" y="${y2}" z="${z1}" />`);
            vertices.push(`    <vertex x="${x1}" y="${y1}" z="${z2}" />`);
            vertices.push(`    <vertex x="${x2}" y="${y1}" z="${z2}" />`);
            vertices.push(`    <vertex x="${x2}" y="${y2}" z="${z2}" />`);
            vertices.push(`    <vertex x="${x1}" y="${y2}" z="${z2}" />`);
            
            // Add 12 triangles (2 per face, 6 faces)
            const v = vertexOffset;
            const faces = [
                [v+0,v+2,v+1], [v+0,v+3,v+2], // bottom
                [v+4,v+5,v+6], [v+4,v+6,v+7], // top
                [v+0,v+1,v+5], [v+0,v+5,v+4], // front
                [v+2,v+3,v+7], [v+2,v+7,v+6], // back
                [v+0,v+4,v+7], [v+0,v+7,v+3], // left
                [v+1,v+2,v+6], [v+1,v+6,v+5]  // right
            ];
            
            faces.forEach(face => {
                triangles.push(`    <triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}" />`);
            });
            
            vertexOffset += 8;
        }
        
        // Create color component
        const r = Math.round(part.target.r);
        const g = Math.round(part.target.g);
        const b = Math.round(part.target.b);
        const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        
        xml += `  <object id="${objectId}" type="model">\n`;
        xml += '   <mesh>\n    <vertices>\n';
        xml += vertices.join('\n') + '\n';
        xml += '    </vertices>\n    <triangles>\n';
        xml += triangles.join('\n') + '\n';
        xml += '    </triangles>\n   </mesh>\n  </object>\n';
        
        // Create colored component wrapper
        xml += `  <object id="${objectId + 1}" type="model">\n`;
        xml += `   <components>\n`;
        xml += `    <component objectid="${objectId}" />\n`;
        xml += `   </components>\n  </object>\n`;
        
        buildItems.push(`   <item objectid="${objectId + 1}" />`);
        objectId += 2;
    }
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    xml += buildItems.join('\n') + '\n';
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function create3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function create3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
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
