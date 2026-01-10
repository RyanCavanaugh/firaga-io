import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export interface ThreeMFSettings {
    filename: string;
    pixelHeight: number;
}

export async function generate3MF(image: PartListImage, settings: ThreeMFSettings) {
    await loadJSZipAnd(() => generate3MFWorker(image, settings));
}

async function loadJSZipAnd(func: () => void) {
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

function generate3MFWorker(image: PartListImage, settings: ThreeMFSettings) {
    const zip = new JSZip();
    
    // Create content types file
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.folder("_rels")!.file(".rels", rels);
    
    // Create 3D model
    const model = create3DModel(image, settings);
    zip.folder("3D")!.file("3dmodel.model", model);
    
    // Generate and save zip file
    zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, `${settings.filename}.3mf`);
    });
}

function create3DModel(image: PartListImage, settings: ThreeMFSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const color = hex.substring(1); // Remove #
        xml += `      <base name="${part.target.name}" displaycolor="${color}" />\n`;
    });

    xml += `    </basematerials>\n`;

    let vertexOffset = 0;
    let objectId = 2;

    // Create an object for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        
        // Find all pixels with this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const cubeVertices = createCubeVertices(x, y, settings.pixelHeight);
                    const cubeTriangles = createCubeTriangles(vertices.length);
                    
                    vertices.push(...cubeVertices);
                    triangles.push(...cubeTriangles);
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${objectId}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v.split(' ')[0]}" y="${v.split(' ')[1]}" z="${v.split(' ')[2]}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t.split(' ')[0]}" v2="${t.split(' ')[1]}" v3="${t.split(' ')[2]}" pid="1" p1="${colorIdx}" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
            
            objectId++;
        }
    });

    xml += `  </resources>\n`;
    xml += `  <build>\n`;
    
    // Add all objects to the build
    for (let i = 2; i < objectId; i++) {
        xml += `    <item objectid="${i}" />\n`;
    }
    
    xml += `  </build>\n`;
    xml += `</model>`;

    return xml;
}

function createCubeVertices(x: number, y: number, height: number): string[] {
    const x0 = x, x1 = x + 1;
    const y0 = y, y1 = y + 1;
    const z0 = 0, z1 = height;
    
    return [
        `${x0} ${y0} ${z0}`,
        `${x1} ${y0} ${z0}`,
        `${x1} ${y1} ${z0}`,
        `${x0} ${y1} ${z0}`,
        `${x0} ${y0} ${z1}`,
        `${x1} ${y0} ${z1}`,
        `${x1} ${y1} ${z1}`,
        `${x0} ${y1} ${z1}`
    ];
}

function createCubeTriangles(offset: number): string[] {
    return [
        // Bottom
        `${offset + 0} ${offset + 1} ${offset + 2}`,
        `${offset + 0} ${offset + 2} ${offset + 3}`,
        // Top
        `${offset + 4} ${offset + 6} ${offset + 5}`,
        `${offset + 4} ${offset + 7} ${offset + 6}`,
        // Front
        `${offset + 0} ${offset + 5} ${offset + 1}`,
        `${offset + 0} ${offset + 4} ${offset + 5}`,
        // Back
        `${offset + 2} ${offset + 7} ${offset + 3}`,
        `${offset + 2} ${offset + 6} ${offset + 7}`,
        // Left
        `${offset + 0} ${offset + 3} ${offset + 7}`,
        `${offset + 0} ${offset + 7} ${offset + 4}`,
        // Right
        `${offset + 1} ${offset + 5} ${offset + 6}`,
        `${offset + 1} ${offset + 6} ${offset + 2}`
    ];
}

// Minimal JSZip interface
declare class JSZip {
    constructor();
    file(name: string, content: string): void;
    folder(name: string): JSZip | null;
    generateAsync(options: { type: string }): Promise<Blob>;
}

declare const JSZip: {
    new(): JSZip;
};
