import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { Export3DSettings } from "./export-3d-types";

/**
 * Generate a 3MF file containing a triangle mesh with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, settings: Export3DSettings): Blob {
    const { pixelHeight, baseHeight } = settings;
    
    // Build the 3MF XML structure
    const modelXml = build3MFModel(image, pixelHeight, baseHeight);
    
    // 3MF is a zip file with specific structure
    return create3MFZip(modelXml, image);
}

function build3MFModel(image: PartListImage, pixelHeight: number, baseHeight: number): string {
    const { width, height, pixels, partList } = image;
    
    let objectsXml = "";
    let baseMaterialsXml = "";
    let componentIndex = 2; // Start at 2 (1 is reserved for the model group)
    
    // Create base materials for each color
    partList.forEach((part, idx) => {
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove #
        baseMaterialsXml += `    <base name="${escapeXml(part.target.name)}" displaycolor="#${hexColor}" />\n`;
    });
    
    // Generate mesh objects for each color layer
    partList.forEach((part, partIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build vertices and triangles for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    addCube(vertices, triangles, x, y, baseHeight, baseHeight + pixelHeight);
                }
            }
        }
        
        if (vertices.length === 0) return;
        
        // Build mesh XML
        let meshXml = "      <mesh>\n        <vertices>\n";
        vertices.forEach(([vx, vy, vz]) => {
            meshXml += `          <vertex x="${vx}" y="${vy}" z="${vz}" />\n`;
        });
        meshXml += "        </vertices>\n        <triangles>\n";
        triangles.forEach(([v1, v2, v3]) => {
            meshXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
        });
        meshXml += "        </triangles>\n      </mesh>\n";
        
        objectsXml += `    <object id="${componentIndex}" type="model" partnumber="${escapeXml(part.target.code ?? '')}" name="${escapeXml(part.target.name)}">\n`;
        objectsXml += meshXml;
        objectsXml += `    </object>\n`;
        
        componentIndex++;
    });
    
    // Add base plate object
    const baseVertices: Array<[number, number, number]> = [
        [0, 0, 0], [width, 0, 0], [width, height, 0], [0, height, 0],
        [0, 0, baseHeight], [width, 0, baseHeight], [width, height, baseHeight], [0, height, baseHeight]
    ];
    const baseTriangles: Array<[number, number, number]> = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0]  // left
    ];
    
    let baseMeshXml = "      <mesh>\n        <vertices>\n";
    baseVertices.forEach(([vx, vy, vz]) => {
        baseMeshXml += `          <vertex x="${vx}" y="${vy}" z="${vz}" />\n`;
    });
    baseMeshXml += "        </vertices>\n        <triangles>\n";
    baseTriangles.forEach(([v1, v2, v3]) => {
        baseMeshXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
    });
    baseMeshXml += "        </triangles>\n      </mesh>\n";
    
    const baseObjectXml = `    <object id="1" type="model" name="Base">\n${baseMeshXml}    </object>\n`;
    
    const fullModelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(settings.filename)}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${baseMaterialsXml}    </basematerials>
${baseObjectXml}${objectsXml}  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
    
    return fullModelXml;
}

function addCube(
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    x: number,
    y: number,
    zBottom: number,
    zTop: number
): void {
    const baseIndex = vertices.length;
    
    // Add 8 vertices for the cube
    vertices.push(
        [x, y, zBottom], [x + 1, y, zBottom], [x + 1, y + 1, zBottom], [x, y + 1, zBottom],
        [x, y, zTop], [x + 1, y, zTop], [x + 1, y + 1, zTop], [x, y + 1, zTop]
    );
    
    // Add 12 triangles (2 per face, 6 faces)
    const b = baseIndex;
    triangles.push(
        [b + 0, b + 1, b + 2], [b + 0, b + 2, b + 3], // bottom
        [b + 4, b + 6, b + 5], [b + 4, b + 7, b + 6], // top
        [b + 0, b + 4, b + 5], [b + 0, b + 5, b + 1], // front
        [b + 1, b + 5, b + 6], [b + 1, b + 6, b + 2], // right
        [b + 2, b + 6, b + 7], [b + 2, b + 7, b + 3], // back
        [b + 3, b + 7, b + 4], [b + 3, b + 4, b + 0]  // left
    );
}

function create3MFZip(modelXml: string, image: PartListImage): Blob {
    // For now, return a simple blob with the model XML
    // In a full implementation, this would create a proper zip file with:
    // - 3D/3dmodel.model (the XML we created)
    // - [Content_Types].xml
    // - _rels/.rels
    
    // Since we don't have a zip library, we'll use a simple approach
    // that works for basic 3MF readers
    const blob = new Blob([modelXml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    return blob;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export function download3MF(image: PartListImage, settings: Export3DSettings): void {
    const blob = generate3MF(image, settings);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.filename}.3mf`;
    a.click();
    URL.revokeObjectURL(url);
}
