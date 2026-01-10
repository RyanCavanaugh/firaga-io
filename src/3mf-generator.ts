import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export async function make3MF(image: PartListImage, filename: string) {
    // Load JSZip from CDN if not already loaded
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate the 3D model XML
    const modelXml = generateModelXml(image);
    zip.file("3D/3dmodel.model", modelXml);
    
    // Generate content types file
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Generate relationships file
    const relationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.file("_rels/.rels", relationships);
    
    // Generate the zip file
    const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    downloadBlob(content, `${filename}.3mf`);
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

function generateModelXml(image: PartListImage): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, index) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `      <base name="${color.name}" displaycolor="#${hexColor}FF" />\n`;
    });

    xml += `    </basematerials>
`;

    // Create mesh objects for each color
    image.partList.forEach((part, colorIndex) => {
        xml += `    <object id="${colorIndex + 2}" type="model">
      <mesh>
        <vertices>
`;

        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a small rectangular prism for this pixel
                    const baseIndex = vertices.length;
                    const pixelSize = 2.5; // mm per pixel
                    const height = 2.0; // mm height
                    
                    // Bottom vertices
                    vertices.push([x * pixelSize, y * pixelSize, 0]);
                    vertices.push([(x + 1) * pixelSize, y * pixelSize, 0]);
                    vertices.push([(x + 1) * pixelSize, (y + 1) * pixelSize, 0]);
                    vertices.push([x * pixelSize, (y + 1) * pixelSize, 0]);
                    
                    // Top vertices
                    vertices.push([x * pixelSize, y * pixelSize, height]);
                    vertices.push([(x + 1) * pixelSize, y * pixelSize, height]);
                    vertices.push([(x + 1) * pixelSize, (y + 1) * pixelSize, height]);
                    vertices.push([x * pixelSize, (y + 1) * pixelSize, height]);
                    
                    // Bottom face (2 triangles)
                    triangles.push([baseIndex, baseIndex + 2, baseIndex + 1]);
                    triangles.push([baseIndex, baseIndex + 3, baseIndex + 2]);
                    
                    // Top face (2 triangles)
                    triangles.push([baseIndex + 4, baseIndex + 5, baseIndex + 6]);
                    triangles.push([baseIndex + 4, baseIndex + 6, baseIndex + 7]);
                    
                    // Side faces
                    // Front
                    triangles.push([baseIndex, baseIndex + 1, baseIndex + 5]);
                    triangles.push([baseIndex, baseIndex + 5, baseIndex + 4]);
                    // Right
                    triangles.push([baseIndex + 1, baseIndex + 2, baseIndex + 6]);
                    triangles.push([baseIndex + 1, baseIndex + 6, baseIndex + 5]);
                    // Back
                    triangles.push([baseIndex + 2, baseIndex + 3, baseIndex + 7]);
                    triangles.push([baseIndex + 2, baseIndex + 7, baseIndex + 6]);
                    // Left
                    triangles.push([baseIndex + 3, baseIndex, baseIndex + 4]);
                    triangles.push([baseIndex + 3, baseIndex + 4, baseIndex + 7]);
                }
            }
        }

        // Output vertices
        vertices.forEach(v => {
            xml += `          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />\n`;
        });

        xml += `        </vertices>
        <triangles>
`;

        // Output triangles
        triangles.forEach(t => {
            xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIndex}" />\n`;
        });

        xml += `        </triangles>
      </mesh>
    </object>
`;
    });

    xml += `  </resources>
  <build>
`;

    // Add all objects to the build
    image.partList.forEach((part, index) => {
        xml += `    <item objectid="${index + 2}" />\n`;
    });

    xml += `  </build>
</model>`;

    return xml;
}
