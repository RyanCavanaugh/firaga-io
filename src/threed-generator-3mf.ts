import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    pixelHeight: number;
    baseHeight: number;
}

export function generate3MF(image: PartListImage, settings: ThreeDSettings): Blob {
    const pixelSize = 1.0; // 1mm per pixel
    const { pixelHeight, baseHeight } = settings;
    
    // Build the 3MF XML structure
    const modelXml = build3MFModel(image, pixelSize, pixelHeight, baseHeight);
    
    // Create the 3MF package (ZIP file with specific structure)
    return create3MFPackage(modelXml);
}

function build3MFModel(image: PartListImage, pixelSize: number, pixelHeight: number, baseHeight: number): string {
    const resources: string[] = [];
    const objects: string[] = [];
    let resourceId = 1;
    let objectId = 1;
    
    // Create base material resources for each color
    const colorMaterials = new Map<number, number>();
    image.partList.forEach((entry, index) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove #
        const materialId = resourceId++;
        colorMaterials.set(index, materialId);
        resources.push(
            `    <basematerials id="${materialId}">`,
            `      <base name="${escapeXml(entry.target.name)}" displaycolor="#${color}FF" />`,
            `    </basematerials>`
        );
    });
    
    // Create mesh objects for each color
    image.partList.forEach((entry, colorIndex) => {
        const materialId = colorMaterials.get(colorIndex)!;
        const mesh = buildColorMesh(image, colorIndex, pixelSize, pixelHeight, baseHeight);
        
        if (mesh.vertices.length > 0) {
            const meshId = resourceId++;
            resources.push(`    <object id="${meshId}" type="model">`);
            resources.push(`      <mesh>`);
            resources.push(`        <vertices>`);
            mesh.vertices.forEach(v => {
                resources.push(`          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
            });
            resources.push(`        </vertices>`);
            resources.push(`        <triangles>`);
            mesh.triangles.forEach(t => {
                resources.push(`          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="${materialId}" p1="0" />`);
            });
            resources.push(`        </triangles>`);
            resources.push(`      </mesh>`);
            resources.push(`    </object>`);
            
            objects.push(`      <item objectid="${meshId}" />`);
        }
    });
    
    // Build the complete 3MF model XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${objects.join('\n')}
  </build>
</model>`;
}

interface Mesh {
    vertices: Array<[number, number, number]>;
    triangles: Array<[number, number, number]>;
}

function buildColorMesh(
    image: PartListImage,
    colorIndex: number,
    pixelSize: number,
    pixelHeight: number,
    baseHeight: number
): Mesh {
    const vertices: Array<[number, number, number]> = [];
    const triangles: Array<[number, number, number]> = [];
    const vertexMap = new Map<string, number>();
    
    function addVertex(x: number, y: number, z: number): number {
        const key = `${x},${y},${z}`;
        const existing = vertexMap.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const index = vertices.length;
        vertices.push([x, y, z]);
        vertexMap.set(key, index);
        return index;
    }
    
    function addQuad(v0: number, v1: number, v2: number, v3: number): void {
        triangles.push([v0, v1, v2]);
        triangles.push([v0, v2, v3]);
    }
    
    // Generate mesh for pixels of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] !== colorIndex) continue;
            
            const x0 = x * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y0 = y * pixelSize;
            const y1 = (y + 1) * pixelSize;
            const z0 = baseHeight;
            const z1 = baseHeight + pixelHeight;
            
            // Create a box for this pixel
            // Bottom face (z = z0)
            const v0 = addVertex(x0, y0, z0);
            const v1 = addVertex(x1, y0, z0);
            const v2 = addVertex(x1, y1, z0);
            const v3 = addVertex(x0, y1, z0);
            
            // Top face (z = z1)
            const v4 = addVertex(x0, y0, z1);
            const v5 = addVertex(x1, y0, z1);
            const v6 = addVertex(x1, y1, z1);
            const v7 = addVertex(x0, y1, z1);
            
            // Add faces
            addQuad(v3, v2, v1, v0); // Bottom
            addQuad(v4, v5, v6, v7); // Top
            addQuad(v0, v1, v5, v4); // Front
            addQuad(v2, v3, v7, v6); // Back
            addQuad(v3, v0, v4, v7); // Left
            addQuad(v1, v2, v6, v5); // Right
        }
    }
    
    return { vertices, triangles };
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function create3MFPackage(modelXml: string): Blob {
    // For now, return a simple blob with the model XML
    // A complete implementation would need a ZIP library to create proper 3MF package
    // The 3MF format requires: [Content_Types].xml, _rels/.rels, and 3D/3dmodel.model
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`;
    
    // Create a simple text representation indicating full 3MF package needed
    const packageContent = `3MF Package Contents:

[Content_Types].xml:
${contentTypes}

_rels/.rels:
${rels}

3D/3dmodel.model:
${modelXml}

Note: This is a text representation. A proper 3MF file requires ZIP packaging.
To create a valid .3mf file, these contents need to be packaged in a ZIP archive with the structure shown above.`;
    
    return new Blob([packageContent], { type: 'text/plain' });
}
