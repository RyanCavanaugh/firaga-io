import { PartListImage, PartListEntry } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");

export async function make3mf(image: PartListImage, filename: string) {
    const loadJsZipAnd = (func: () => void) => {
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
    };

    loadJsZipAnd(() => make3mfWorker(image, filename));
}

function make3mfWorker(image: PartListImage, filename: string) {
    const zip = new JSZip();

    // Create 3D model with one mesh combining all colored pixels
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" unit="millimeter">
  <metadata name="Author">firaga.io</metadata>
  <metadata name="Application">firaga.io</metadata>
  <objects>
    <object id="1" type="model">
      <mesh>
        <vertices>`;

    // Generate all vertices
    const coloredPixels: Map<number, number[][]> = new Map();
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        coloredPixels.set(colorIdx, []);
    }

    // Find pixels for each color and generate vertices
    const vertexIndexByColor: Map<number, number[]> = new Map();
    let vertexIndex = 0;

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIdx = image.pixels[y][x];
            if (colorIdx !== -1) {
                const z = colorIdx * 1; // Stack colors vertically
                const vertices = [
                    [x, y, z],
                    [x + 1, y, z],
                    [x + 1, y + 1, z],
                    [x, y + 1, z],
                    [x, y, z + 0.5],
                    [x + 1, y, z + 0.5],
                    [x + 1, y + 1, z + 0.5],
                    [x, y + 1, z + 0.5],
                ];

                if (!vertexIndexByColor.has(colorIdx)) {
                    vertexIndexByColor.set(colorIdx, []);
                }

                const indices = vertexIndexByColor.get(colorIdx)!;
                for (const v of vertices) {
                    modelXml += `
          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`;
                    indices.push(vertexIndex);
                    vertexIndex++;
                }
            }
        }
    }

    modelXml += `
        </vertices>
        <triangles>`;

    // Generate triangles for each color's pixels
    for (const [colorIdx, indices] of vertexIndexByColor) {
        for (let i = 0; i < indices.length; i += 8) {
            // Cube triangles (8 vertices per pixel = 1 cube)
            const v = [indices[i], indices[i + 1], indices[i + 2], indices[i + 3],
                       indices[i + 4], indices[i + 5], indices[i + 6], indices[i + 7]];
            
            // Bottom face
            modelXml += `
          <triangle v1="${v[0]}" v2="${v[1]}" v3="${v[2]}"/>`;
            modelXml += `
          <triangle v1="${v[2]}" v2="${v[3]}" v3="${v[0]}"/>`;
            // Top face
            modelXml += `
          <triangle v1="${v[4]}" v2="${v[6]}" v3="${v[5]}"/>`;
            modelXml += `
          <triangle v1="${v[6]}" v2="${v[4]}" v3="${v[7]}"/>`;
            // Front face
            modelXml += `
          <triangle v1="${v[0]}" v2="${v[4]}" v3="${v[5]}"/>`;
            modelXml += `
          <triangle v1="${v[5]}" v2="${v[1]}" v3="${v[0]}"/>`;
            // Back face
            modelXml += `
          <triangle v1="${v[2]}" v2="${v[6]}" v3="${v[7]}"/>`;
            modelXml += `
          <triangle v1="${v[7]}" v2="${v[3]}" v3="${v[2]}"/>`;
            // Left face
            modelXml += `
          <triangle v1="${v[0]}" v2="${v[3]}" v3="${v[7]}"/>`;
            modelXml += `
          <triangle v1="${v[7]}" v2="${v[4]}" v3="${v[0]}"/>`;
            // Right face
            modelXml += `
          <triangle v1="${v[1]}" v2="${v[5]}" v3="${v[6]}"/>`;
            modelXml += `
          <triangle v1="${v[6]}" v2="${v[2]}" v3="${v[1]}"/>`;
        }
    }

    modelXml += `
        </triangles>
      </mesh>
    </object>
  </objects>
  <build>
    <item objectid="1"/>
  </build>
</model>`;

    // Add model to zip
    zip.file("3D/3dmodel.model", modelXml);

    // Create relationships XML
    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="3D/3dmodel.model"/>
</Relationships>`;
    zip.file("_rels/.rels", relsXml);

    // Create content types XML
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-3mf.model+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypesXml);

    // Generate file
    zip.generateAsync({ type: "blob" }).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.3mf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}


export async function makeOpenSCADZip(image: PartListImage, filename: string) {
    const loadJsZipAnd = (func: () => void) => {
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
    };

    loadJsZipAnd(() => makeOpenSCADZipWorker(image, filename));
}

function makeOpenSCADZipWorker(image: PartListImage, filename: string) {
    const zip = new JSZip();

    // Create monochrome image for each color
    const imagePromises: Promise<void>[] = [];

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;

        // Create black/white image where filled pixels are white
        const imageData = ctx.createImageData(image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                if (image.pixels[y][x] === colorIdx) {
                    // White for filled pixels
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                } else {
                    // Black for empty pixels
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Get PNG data and wait for it
        const promise = new Promise<void>(resolve => {
            canvas.toBlob(blob => {
                if (blob) {
                    zip.file(`masks/color_${colorIdx}_${entry.target.name}.png`, blob);
                }
                resolve();
            }, "image/png");
        });
        imagePromises.push(promise);
    }

    // Create OpenSCAD script
    let scadCode = `// Generated by firaga.io
// 3D display using heightmaps

// Height of each layer in mm
layer_height = 2;

// Image size
width = ${image.width};
height = ${image.height};
depth = ${image.partList.length} * layer_height;

// Colors for each layer
colors = [
`;

    for (let i = 0; i < image.partList.length; i++) {
        const hex = colorEntryToHex(image.partList[i].target);
        const r = parseInt(hex.substr(1, 2), 16) / 255;
        const g = parseInt(hex.substr(3, 2), 16) / 255;
        const b = parseInt(hex.substr(5, 2), 16) / 255;
        scadCode += `  [${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}]${i < image.partList.length - 1 ? ',' : ''}
`;
    }

    scadCode += `];

// Module to create a layer from heightmap
module layer(z, color_idx, image_file) {
    color(colors[color_idx])
        linear_extrude(height = layer_height)
            projection(cut = false)
                translate([0, 0, z])
                    surface(file = image_file, center = true, convexity = 5);
}

// Combine all layers
union() {
`;

    for (let i = 0; i < image.partList.length; i++) {
        scadCode += `    layer(${i * 2}, ${i}, "masks/color_${i}_${image.partList[i].target.name}.png");
`;
    }

    scadCode += `}
`;

    zip.file("design.scad", scadCode);

    // Wait for all images to be added, then generate file
    Promise.all(imagePromises).then(() => {
        zip.generateAsync({ type: "blob" }).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}-openscad.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });
}
