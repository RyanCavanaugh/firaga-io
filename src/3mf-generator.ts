import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDExportSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
}

/**
 * Generates a 3MF file containing triangle meshes for each color in the image
 */
export function generate3MF(image: PartListImage, settings: ThreeDExportSettings): Blob {
    const { pixelWidth, pixelHeight, pixelDepth } = settings;
    
    // Build meshes for each color
    const meshes: Array<{ colorHex: string; vertices: number[]; triangles: number[] }> = [];
    
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const vertices: number[] = [];
        const triangles: number[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    // Add a box for this pixel
                    const x0 = x * pixelWidth;
                    const y0 = y * pixelHeight;
                    const z0 = 0;
                    const x1 = x0 + pixelWidth;
                    const y1 = y0 + pixelHeight;
                    const z1 = z0 + pixelDepth;
                    
                    // 8 vertices of the box
                    const boxVerts = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];
                    
                    boxVerts.forEach(v => vertices.push(...v));
                    
                    // 12 triangles (2 per face, 6 faces)
                    const base = vertexIndex;
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];
                    
                    faces.forEach(f => triangles.push(base + f[0], base + f[1], base + f[2]));
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            meshes.push({
                colorHex: colorEntryToHex(part.target).substring(1), // Remove #
                vertices,
                triangles
            });
        }
    }
    
    // Generate 3MF XML
    const xml = build3MFContent(meshes);
    return create3MFZip(xml);
}

function build3MFContent(meshes: Array<{ colorHex: string; vertices: number[]; triangles: number[] }>): string {
    let objectsXml = '';
    let resourcesXml = '';
    let buildXml = '';
    
    meshes.forEach((mesh, idx) => {
        const objectId = idx + 1;
        const materialId = idx + 1;
        
        // Add material resource
        resourcesXml += `    <basematerials id="${materialId}">
      <base name="Color${idx}" displaycolor="#${mesh.colorHex}" />
    </basematerials>\n`;
        
        // Add mesh object
        let verticesXml = '';
        for (let i = 0; i < mesh.vertices.length; i += 3) {
            verticesXml += `        <vertex x="${mesh.vertices[i]}" y="${mesh.vertices[i + 1]}" z="${mesh.vertices[i + 2]}" />\n`;
        }
        
        let trianglesXml = '';
        for (let i = 0; i < mesh.triangles.length; i += 3) {
            trianglesXml += `        <triangle v1="${mesh.triangles[i]}" v2="${mesh.triangles[i + 1]}" v3="${mesh.triangles[i + 2]}" pid="${materialId}" p1="0" />\n`;
        }
        
        objectsXml += `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>\n`;
        
        buildXml += `    <item objectid="${objectId}" />\n`;
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resourcesXml}${objectsXml}  </resources>
  <build>
${buildXml}  </build>
</model>`;
}

function create3MFZip(modelXml: string): Blob {
    // For now, return a simple blob with the XML
    // In production, this should create a proper ZIP file with required 3MF structure
    // The 3MF format requires: [Content_Types].xml, .rels folder, and 3D/3dmodel.model
    
    // Create minimal 3MF structure
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    
    // Note: This is a simplified version. A proper implementation would use JSZip or similar
    // to create a valid ZIP file structure. For now, we'll just return the model XML.
    return new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}
