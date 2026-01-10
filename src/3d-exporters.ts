import { PartListImage } from "./image-utils";

declare const JSZip: any;

export type Export3DSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    await load3DLibrariesAnd(() => export3DWorker(image, settings));
}

async function load3DLibrariesAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

function export3DWorker(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        export3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        exportOpenSCADMasks(image, settings);
    }
}

function export3MF(image: PartListImage, settings: Export3DSettings) {
    // Create 3MF file with separate material shapes for each color
    const xml = generate3MFContent(image, settings);
    
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", getContentTypesXML());
    zip.file("_rels/.rels", getRelsXML());
    
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${settings.filename}.3mf`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const blockHeight = settings.height;
    
    let objectId = 1;
    let vertexOffset = 0;
    const objects: string[] = [];
    const buildItems: string[] = [];
    
    // Create materials section
    const materials = partList.map((part, idx) => {
        const { r, g, b } = part.target;
        const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        return `    <basematerials id="${idx + 1}">
      <base name="${part.target.name}" displaycolor="${colorHex}" />
    </basematerials>`;
    }).join('\n');
    
    // Create one object per color
    partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexIndex = 0;
        
        // Find all pixels of this color and create cubes for them
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a cube at this position
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = blockHeight;
                    
                    // 8 vertices of the cube
                    const v0 = localVertexIndex++;
                    const v1 = localVertexIndex++;
                    const v2 = localVertexIndex++;
                    const v3 = localVertexIndex++;
                    const v4 = localVertexIndex++;
                    const v5 = localVertexIndex++;
                    const v6 = localVertexIndex++;
                    const v7 = localVertexIndex++;
                    
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
                    triangles.push(
                        // Bottom face
                        `      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`,
                        `      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`,
                        // Top face
                        `      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`,
                        `      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`,
                        // Front face
                        `      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`,
                        `      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`,
                        // Back face
                        `      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`,
                        `      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`,
                        // Left face
                        `      <triangle v1="${v3}" v2="${v0}" v3="${v4}" />`,
                        `      <triangle v1="${v3}" v2="${v4}" v3="${v7}" />`,
                        // Right face
                        `      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`,
                        `      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`
                    );
                }
            }
        }
        
        if (vertices.length > 0) {
            objects.push(`  <object id="${objectId}" type="model">
    <mesh>
    <vertices>
${vertices.join('\n')}
    </vertices>
    <triangles>
${triangles.join('\n')}
    </triangles>
    </mesh>
  </object>`);
            
            buildItems.push(`    <item objectid="${objectId}" pid="${partIndex + 1}" pindex="0" />`);
            objectId++;
        }
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials}
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

function getContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`;
}

async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings) {
    const { width, height, partList, pixels } = image;
    const zip = new JSZip();
    
    // Create one monochrome image per color
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const colorName = sanitizeFilename(part.target.name);
        zip.file(`${colorName}.png`, blob);
    }
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);
    
    // Generate zip
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${settings.filename}_openscad.zip`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList } = image;
    const pitch = settings.pitch;
    const blockHeight = settings.height;
    
    let scad = `// OpenSCAD model generated from firaga.io
// Image size: ${width}x${height}
// Pitch: ${pitch}mm
// Height: ${blockHeight}mm

`;
    
    partList.forEach((part, index) => {
        const colorName = sanitizeFilename(part.target.name);
        const { r, g, b } = part.target;
        
        scad += `// Color: ${part.target.name} (${part.count} pixels)
module color_${index}() {
    color([${r/255}, ${g/255}, ${b/255}])
    surface(file = "${colorName}.png", center = true, invert = true);
}

`;
    });
    
    scad += `// Combine all colors
union() {
`;
    
    partList.forEach((part, index) => {
        scad += `    scale([${pitch}, ${pitch}, ${blockHeight}])
    translate([${-width/2}, ${-height/2}, 0])
    color_${index}();
`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
