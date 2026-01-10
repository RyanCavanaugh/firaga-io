import { PartListImage } from "../image-utils";
import { saveAs } from 'file-saver';

declare const JSZip: typeof import("jszip");

/**
 * Generate a 3MF file with triangle mesh and separate material shapes for each color
 */
export function generate3MF(image: PartListImage, filename: string) {
    // Load JSZip for creating 3MF (which is a zip file)
    load3MFLibraries(() => generate3MFWorker(image, filename));
}

async function load3MFLibraries(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}

function generate3MFWorker(image: PartListImage, filename: string) {
    const zip = new JSZip();
    
    // 3MF specification requires specific folder structure
    const rels = zip.folder("_rels");
    const threedFolder = zip.folder("3D");
    
    // Add .rels file
    rels!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);
    
    // Add [Content_Types].xml
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    // Generate the 3D model XML
    const modelXml = generate3DModelXml(image);
    threedFolder!.file("3dmodel.model", modelXml);
    
    // Generate and download the zip
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        saveAs(content, `${filename}.3mf`);
    });
}

function generate3DModelXml(image: PartListImage): string {
    const pixelHeight = 1.0; // Height of each pixel in 3D space
    const pixelSize = 1.0;   // Size of each pixel (1mm x 1mm)
    
    let vertexId = 1;
    let triangleId = 1;
    const vertices: string[] = [];
    const triangles: string[] = [];
    
    // Group pixels by color
    const colorGroups = new Map<number, Array<{x: number, y: number}>>();
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIndex = image.pixels[y][x];
            if (colorIndex !== undefined && colorIndex >= 0) {
                if (!colorGroups.has(colorIndex)) {
                    colorGroups.set(colorIndex, []);
                }
                colorGroups.get(colorIndex)!.push({x, y});
            }
        }
    }
    
    // Build resources (materials) and objects for each color
    const resources: string[] = [];
    const objects: string[] = [];
    let objectId = 1;
    let materialId = 1;
    const buildItems: string[] = [];
    
    colorGroups.forEach((pixels, colorIndex) => {
        const color = image.partList[colorIndex];
        if (!color) return;
        
        // Add material (color) to resources
        const hexColor = rgbToHex(color.target.r, color.target.g, color.target.b);
        resources.push(`    <basematerials id="${materialId}">
      <base name="${color.target.name}" displaycolor="${hexColor}" />
    </basematerials>`);
        
        // Create mesh for this color
        const meshVertices: string[] = [];
        const meshTriangles: string[] = [];
        let meshVertexId = 0;
        
        // For each pixel of this color, create a box
        pixels.forEach(({x, y}) => {
            const baseX = x * pixelSize;
            const baseY = y * pixelSize;
            const baseZ = 0;
            
            // Define 8 vertices of a box
            const boxVertices = [
                [baseX, baseY, baseZ],
                [baseX + pixelSize, baseY, baseZ],
                [baseX + pixelSize, baseY + pixelSize, baseZ],
                [baseX, baseY + pixelSize, baseZ],
                [baseX, baseY, baseZ + pixelHeight],
                [baseX + pixelSize, baseY, baseZ + pixelHeight],
                [baseX + pixelSize, baseY + pixelSize, baseZ + pixelHeight],
                [baseX, baseY + pixelSize, baseZ + pixelHeight],
            ];
            
            const startVertex = meshVertexId;
            boxVertices.forEach(([vx, vy, vz]) => {
                meshVertices.push(`      <vertex x="${vx}" y="${vy}" z="${vz}" />`);
                meshVertexId++;
            });
            
            // Define 12 triangles (2 per face, 6 faces)
            const boxFaces = [
                // Bottom
                [startVertex, startVertex + 1, startVertex + 2],
                [startVertex, startVertex + 2, startVertex + 3],
                // Top
                [startVertex + 4, startVertex + 6, startVertex + 5],
                [startVertex + 4, startVertex + 7, startVertex + 6],
                // Front
                [startVertex, startVertex + 4, startVertex + 5],
                [startVertex, startVertex + 5, startVertex + 1],
                // Back
                [startVertex + 2, startVertex + 6, startVertex + 7],
                [startVertex + 2, startVertex + 7, startVertex + 3],
                // Left
                [startVertex, startVertex + 3, startVertex + 7],
                [startVertex, startVertex + 7, startVertex + 4],
                // Right
                [startVertex + 1, startVertex + 5, startVertex + 6],
                [startVertex + 1, startVertex + 6, startVertex + 2],
            ];
            
            boxFaces.forEach(([v1, v2, v3]) => {
                meshTriangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`);
            });
        });
        
        objects.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${meshVertices.join('\n')}
        </vertices>
        <triangles>
${meshTriangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        
        buildItems.push(`    <item objectid="${objectId}" />`);
        
        objectId++;
        materialId++;
    });
    
    // Construct final XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
    
    return xml;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex.toUpperCase();
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
