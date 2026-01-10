import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

declare const JSZip: any;

// Generate a 3MF triangle mesh file
export async function generate3MF(image: PartListImage, filename: string) {
    // Load JSZip if not already loaded
    await loadJSZip();

    const baseHeight = 1.0; // Base plate height in mm
    const pixelHeight = 0.5; // Height per pixel in mm
    const pixelSize = 2.5; // Size of each pixel in mm

    // Build the 3D model XML for 3MF format
    let modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
    <resources>
        <basematerials id="1">
`;

    // Add materials (colors)
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = Math.round(color.r);
        const g = Math.round(color.g);
        const b = Math.round(color.b);
        modelXML += `            <base name="${color.name}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />\n`;
    });

    modelXML += `        </basematerials>\n`;

    let vertexId = 0;
    let triangleData = '';

    // Generate meshes for each color
    image.partList.forEach((part, materialIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        const localVertexStart = vertexId;

        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = baseHeight + pixelHeight;

                    // 8 vertices of the box
                    const v = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];

                    const baseIdx = vertexId;
                    v.forEach(vertex => {
                        vertices.push(`            <vertex x="${vertex[0]}" y="${vertex[1]}" z="${vertex[2]}" />`);
                        vertexId++;
                    });

                    // 12 triangles (2 per face, 6 faces)
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];

                    faces.forEach(face => {
                        triangles.push(`            <triangle v1="${baseIdx + face[0]}" v2="${baseIdx + face[1]}" v3="${baseIdx + face[2]}" />`);
                    });
                }
            }
        }

        if (vertices.length > 0) {
            modelXML += `        <object id="${materialIdx + 2}" type="model" materialid="1" materialprop="${materialIdx}">\n`;
            modelXML += `            <mesh>\n`;
            modelXML += `                <vertices>\n`;
            modelXML += vertices.join('\n') + '\n';
            modelXML += `                </vertices>\n`;
            modelXML += `                <triangles>\n`;
            modelXML += triangles.join('\n') + '\n';
            modelXML += `                </triangles>\n`;
            modelXML += `            </mesh>\n`;
            modelXML += `        </object>\n`;
        }
    });

    modelXML += `    </resources>
    <build>
`;

    // Add all objects to the build
    image.partList.forEach((part, idx) => {
        modelXML += `        <item objectid="${idx + 2}" />\n`;
    });

    modelXML += `    </build>
</model>`;

    // Create 3MF zip file
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", modelXML);
    
    // Add required [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);

    // Add _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.folder("_rels");
    zip.file("_rels/.rels", rels);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename.replace(/\.[^.]+$/, '')}.3mf`);
}

// Generate OpenSCAD masks format (zip with images + .scad file)
export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    await loadJSZip();

    const zip = new JSZip();
    const pixelSize = 2.5; // mm per pixel
    const baseHeight = 1.0; // mm
    const pixelHeight = 0.5; // mm

    // Generate one black/white image per color
    const imagePromises = image.partList.map(async (part, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;

        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);

        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to blob
        return new Promise<{ name: string, blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({ name: `mask_${idx}_${colorName}.png`, blob: blob! });
            });
        });
    });

    const images = await Promise.all(imagePromises);
    images.forEach(img => {
        zip.file(img.name, img.blob);
    });

    // Generate OpenSCAD file
    let scadCode = `// Generated OpenSCAD file for ${filename}
// Pixel size: ${pixelSize}mm
// Image size: ${image.width} x ${image.height} pixels
// Physical size: ${image.width * pixelSize}mm x ${image.height * pixelSize}mm

pixel_size = ${pixelSize};
base_height = ${baseHeight};
pixel_height = ${pixelHeight};
width = ${image.width};
height = ${image.height};

module heightmap_layer(image_file, color) {
    color(color)
    translate([0, 0, base_height])
    scale([pixel_size, pixel_size, pixel_height])
    surface(file = image_file, center = false, invert = true);
}

union() {
    // Base plate
    color([0.8, 0.8, 0.8])
    cube([width * pixel_size, height * pixel_size, base_height]);
    
    // Color layers
`;

    image.partList.forEach((part, idx) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        scadCode += `    heightmap_layer("mask_${idx}_${colorName}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);\n`;
    });

    scadCode += `}
`;

    zip.file("model.scad", scadCode);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename.replace(/\.[^.]+$/, '')}_openscad.zip`);
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        await new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
