import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

// Load JSZip library dynamically
async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

export async function make3MF(image: PartListImage, filename: string) {
    const xml = generate3MFContent(image);
    downloadFile(xml, `${filename}.3mf`, "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function generate3MFContent(image: PartListImage): string {
    // 3MF is an XML-based format
    // We'll create a simple heightmap-based mesh where each pixel becomes a vertical column
    const pixelHeight = 1.0; // Height of each pixel/voxel
    const pixelSize = 1.0; // Size of each pixel in X and Y
    
    let vertices = "";
    let triangles = "";
    let vertexIndex = 0;
    const materials: string[] = [];
    const meshes: { partIndex: number, triangleData: string, vertexData: string }[] = [];

    // Create materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        materials.push(`    <basematerials id="${idx + 1}">
      <base name="${color.name}" displaycolor="#${hex}FF" />
    </basematerials>`);
    });

    // Generate mesh for each color
    image.partList.forEach((part, partIndex) => {
        let colorVertices = "";
        let colorTriangles = "";
        let colorVertexIndex = 0;
        const vertexMap = new Map<string, number>();

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;

                    // Define 8 vertices of the box
                    const boxVertices = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // Bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // Top
                    ];

                    const startIdx = colorVertexIndex;
                    boxVertices.forEach(([vx, vy, vz]) => {
                        const key = `${vx},${vy},${vz}`;
                        if (!vertexMap.has(key)) {
                            colorVertices += `      <vertex x="${vx}" y="${vy}" z="${vz}" />\n`;
                            vertexMap.set(key, colorVertexIndex);
                            colorVertexIndex++;
                        }
                    });

                    // Define 12 triangles (2 per face, 6 faces)
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // Bottom
                        [4, 6, 5], [4, 7, 6], // Top
                        [0, 4, 5], [0, 5, 1], // Front
                        [1, 5, 6], [1, 6, 2], // Right
                        [2, 6, 7], [2, 7, 3], // Back
                        [3, 7, 4], [3, 4, 0]  // Left
                    ];

                    faces.forEach(([i0, i1, i2]) => {
                        const v0 = startIdx + i0;
                        const v1 = startIdx + i1;
                        const v2 = startIdx + i2;
                        colorTriangles += `      <triangle v1="${v0}" v2="${v1}" v3="${v2}" />\n`;
                    });
                }
            }
        }

        if (colorVertices) {
            meshes.push({
                partIndex,
                vertexData: colorVertices,
                triangleData: colorTriangles
            });
        }
    });

    // Build the complete 3MF XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
`;

    meshes.forEach((mesh, idx) => {
        xml += `    <object id="${idx + 100}" type="model">
      <mesh>
        <vertices>
${mesh.vertexData}        </vertices>
        <triangles>
${mesh.triangleData}        </triangles>
      </mesh>
    </object>
`;
    });

    xml += `  </resources>
  <build>
`;

    meshes.forEach((mesh, idx) => {
        xml += `    <item objectid="${idx + 100}" />
`;
    });

    xml += `  </build>
</model>`;

    return xml;
}

export async function makeOpenSCADMasks(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one mask image per color
    image.partList.forEach((part, partIndex) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white (background)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG and add to zip
        const dataURL = canvas.toDataURL("image/png");
        const base64Data = dataURL.split(',')[1];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${colorName}_mask.png`, base64Data, { base64: true });
    });
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download zip
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
        downloadFile(content, `${filename}_openscad.zip`, "application/zip");
    });
}

function generateOpenSCADFile(image: PartListImage): string {
    let scad = `// Generated OpenSCAD file for ${image.width}x${image.height} pixel art
// Each color is represented by a heightmap mask

$fn = 20; // Resolution for cylinders/spheres

// Pixel dimensions
pixel_size = 1.0;
pixel_height = 1.0;

`;

    // Add a module for each color
    image.partList.forEach((part, partIndex) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scad += `// ${part.target.name}
module layer_${colorName}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    scale([pixel_size, pixel_size, pixel_height])
    surface(file = "${colorName}_mask.png", center = false, invert = true);
}

`;
    });

    // Add union of all layers
    scad += `// Combine all layers
union() {
`;

    image.partList.forEach((part) => {
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        scad += `    layer_${colorName}();
`;
    });

    scad += `}
`;

    return scad;
}

function downloadFile(content: string | Blob, filename: string, mimeType: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
