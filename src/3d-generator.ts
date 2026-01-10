import { PartListImage } from "./image-utils";
import * as FileSaver from "file-saver";

declare const fflate: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    height: number; // Height of each pixel in mm
    baseHeight: number; // Height of base layer in mm
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string) {
    await loadFflateAnd(() => {
        if (settings.format === "3mf") {
            generate3MF(image, settings, filename);
        } else {
            generateOpenSCADMasks(image, settings, filename);
        }
    });
}

async function loadFflateAnd(func: () => void) {
    const tagName = "fflate-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const width = image.width;
    const height = image.height;
    const pixelSize = 1.0; // 1mm per pixel
    
    // Build 3MF XML content
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
`;

    let nextObjectId = 1;
    const objectIds: number[] = [];

    // Create a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.height;

                    // 8 vertices of the cube
                    const baseVertex = vertexCount;
                    vertices.push(
                        `      <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );

                    // 12 triangles (2 per face, 6 faces)
                    const v = baseVertex;
                    // Bottom face
                    triangles.push(`      <triangle v1="${v}" v2="${v+2}" v3="${v+1}" />`);
                    triangles.push(`      <triangle v1="${v}" v2="${v+3}" v3="${v+2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" />`);
                    triangles.push(`      <triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${v}" v2="${v+1}" v3="${v+5}" />`);
                    triangles.push(`      <triangle v1="${v}" v2="${v+5}" v3="${v+4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${v+2}" v2="${v+3}" v3="${v+7}" />`);
                    triangles.push(`      <triangle v1="${v+2}" v2="${v+7}" v3="${v+6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${v}" v2="${v+4}" v3="${v+7}" />`);
                    triangles.push(`      <triangle v1="${v}" v2="${v+7}" v3="${v+3}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" />`);
                    triangles.push(`      <triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const objectId = nextObjectId++;
            objectIds.push(objectId);
            
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

            modelXml += `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>
    <basematerials id="${objectId + 1000}">
      <base name="${color.target.name}" displaycolor="${hexColor}" />
    </basematerials>
`;
        }
    }

    // Create a build item that references all objects
    modelXml += `  </resources>
  <build>
`;
    for (const id of objectIds) {
        modelXml += `    <item objectid="${id}" />
`;
    }
    modelXml += `  </build>
</model>`;

    // Create 3MF package (ZIP with specific structure)
    const files = [
        { name: "3D/3dmodel.model", content: modelXml },
        { 
            name: "[Content_Types].xml", 
            content: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`
        },
        {
            name: "_rels/.rels",
            content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`
        }
    ];

    const blob = createZipBlob(files);
    FileSaver.saveAs(blob, `${filename}.3mf`);
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string) {
    const width = image.width;
    const height = image.height;

    const files: ZipFile[] = [];

    // Create one image per color
    const imageFiles: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to data URL and then to blob
        const dataUrl = canvas.toDataURL("image/png");
        const imageName = `color_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        imageFiles.push(imageName);
        files.push({ name: imageName, content: dataUrl, isBinary: true });
    }

    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image dimensions: ${width} x ${height}
// Pixel height: ${settings.height}mm
// Base height: ${settings.baseHeight}mm

pixel_size = 1.0; // mm
pixel_height = ${settings.height};
base_height = ${settings.baseHeight};
image_width = ${width};
image_height = ${height};

module color_layer(image_file, color) {
    color(color)
    translate([0, 0, base_height])
    scale([pixel_size, pixel_size, pixel_height])
    surface(file=image_file, center=true, invert=true);
}

union() {
    // Base layer
    color("lightgray")
    cube([image_width * pixel_size, image_height * pixel_size, base_height]);
    
    // Color layers
`;

    for (let i = 0; i < imageFiles.length; i++) {
        const color = image.partList[i].target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        scadContent += `    color_layer("${imageFiles[i]}", [${r}, ${g}, ${b}]);\n`;
    }

    scadContent += `}
`;

    files.push({ name: "model.scad", content: scadContent, isBinary: false });

    const blob = createZipBlob(files);
    FileSaver.saveAs(blob, `${filename}_openscad.zip`);
}

type ZipFile = {
    name: string;
    content: string | Blob;
    isBinary?: boolean;
};

function createZipBlob(files: ZipFile[]): Blob {
    const zipData: Record<string, Uint8Array> = {};
    
    for (const file of files) {
        if (file.isBinary && typeof file.content === 'string') {
            // Convert data URL to Uint8Array
            const base64 = file.content.split(',')[1];
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            zipData[file.name] = array;
        } else {
            // Text content
            const encoder = new TextEncoder();
            zipData[file.name] = encoder.encode(file.content as string);
        }
    }
    
    const zipped = fflate.zipSync(zipData);
    return new Blob([zipped], { type: "application/zip" });
}

function toHex(n: number): string {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
