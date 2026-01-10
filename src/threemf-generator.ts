import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeMFSettings {
    pixelHeight: number;
    pixelWidth: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeMFSettings): void {
    const { pixelHeight, pixelWidth, filename } = settings;
    
    // Build the 3MF content
    const meshes: string[] = [];
    const materials: string[] = [];
    const items: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, colorIndex) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <base:basematerials id="${colorIndex + 2}">
      <base:basematerial name="${part.target.name}" displaycolor="#${hex}" />
    </base:basematerials>`);
    });
    
    // Generate meshes for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: number[][] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexIndex;
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length === 0) return;
        
        const meshId = colorIndex + 2;
        const verticesStr = vertices
            .map(([x, y, z]) => `      <vertex x="${x}" y="${y}" z="${z}" />`)
            .join('\n');
        const trianglesStr = triangles
            .map(tri => `      <triangle v1="${tri[0]}" v2="${tri[1]}" v3="${tri[2]}" />`)
            .join('\n');
        
        meshes.push(`  <object id="${meshId}" type="model" pid="${meshId}" pindex="0">
    <mesh>
      <vertices>
${verticesStr}
      </vertices>
      <triangles>
${trianglesStr}
      </triangles>
    </mesh>
  </object>`);
        
        items.push(`    <item objectid="${meshId}" />`);
    });
    
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${filename}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
${materials.join('\n')}
${meshes.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`;
    
    // Create the 3MF package (ZIP with specific structure)
    createZipAndDownload(filename + '.3mf', {
        '3D/3dmodel.model': modelXml,
        '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`,
        '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`
    });
}

function createZipAndDownload(filename: string, files: Record<string, string>): void {
    // We'll use JSZip library
    loadJSZipAnd(() => {
        const zip = new (window as any).JSZip();
        
        for (const [path, content] of Object.entries(files)) {
            zip.file(path, content);
        }
        
        zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
            downloadBlob(blob, filename);
        });
    });
}

function loadJSZipAnd(callback: () => void): void {
    const tagName = 'jszip-script-tag';
    const existing = document.getElementById(tagName);
    
    if (existing) {
        callback();
    } else {
        const script = document.createElement('script');
        script.id = tagName;
        script.onload = () => callback();
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(script);
    }
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
