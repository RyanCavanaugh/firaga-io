import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDFormat = "3mf" | "openscad";

export type ThreeDSettings = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        return generate3MF(image, settings);
    } else {
        return generateOpenSCAD(image, settings);
    }
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

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { pixelHeight, baseHeight } = settings;
    
    // Build 3MF XML structure
    let meshId = 1;
    const meshes: string[] = [];
    const components: string[] = [];
    const materials: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, index) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <base:material materialid="${index}" displaycolor="#${color}" />`);
    });
    
    // Generate mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const baseVertexIndex = vertexIndex;
                    
                    // 8 vertices of the cube
                    const x0 = x, x1 = x + 1;
                    const y0 = y, y1 = y + 1;
                    const z0 = 0, z1 = pixelHeight;
                    
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
                        // Bottom
                        `      <triangle v1="${baseVertexIndex + 0}" v2="${baseVertexIndex + 2}" v3="${baseVertexIndex + 1}" />`,
                        `      <triangle v1="${baseVertexIndex + 0}" v2="${baseVertexIndex + 3}" v3="${baseVertexIndex + 2}" />`,
                        // Top
                        `      <triangle v1="${baseVertexIndex + 4}" v2="${baseVertexIndex + 5}" v3="${baseVertexIndex + 6}" />`,
                        `      <triangle v1="${baseVertexIndex + 4}" v2="${baseVertexIndex + 6}" v3="${baseVertexIndex + 7}" />`,
                        // Front
                        `      <triangle v1="${baseVertexIndex + 0}" v2="${baseVertexIndex + 1}" v3="${baseVertexIndex + 5}" />`,
                        `      <triangle v1="${baseVertexIndex + 0}" v2="${baseVertexIndex + 5}" v3="${baseVertexIndex + 4}" />`,
                        // Back
                        `      <triangle v1="${baseVertexIndex + 2}" v2="${baseVertexIndex + 3}" v3="${baseVertexIndex + 7}" />`,
                        `      <triangle v1="${baseVertexIndex + 2}" v2="${baseVertexIndex + 7}" v3="${baseVertexIndex + 6}" />`,
                        // Left
                        `      <triangle v1="${baseVertexIndex + 3}" v2="${baseVertexIndex + 0}" v3="${baseVertexIndex + 4}" />`,
                        `      <triangle v1="${baseVertexIndex + 3}" v2="${baseVertexIndex + 4}" v3="${baseVertexIndex + 7}" />`,
                        // Right
                        `      <triangle v1="${baseVertexIndex + 1}" v2="${baseVertexIndex + 2}" v3="${baseVertexIndex + 6}" />`,
                        `      <triangle v1="${baseVertexIndex + 1}" v2="${baseVertexIndex + 6}" v3="${baseVertexIndex + 5}" />`
                    );
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const mesh = `  <mesh:mesh>
    <mesh:vertices>
${vertices.join('\n')}
    </mesh:vertices>
    <mesh:triangles>
${triangles.join('\n')}
    </mesh:triangles>
  </mesh:mesh>`;
            
            meshes.push(mesh);
            components.push(`    <object id="${meshId}" type="model" pid="${colorIndex}" p:pindex="0">\n${mesh}\n    </object>`);
            meshId++;
        }
    });
    
    // Build base plate
    const baseVertices = [
        `      <vertex x="0" y="0" z="${-baseHeight}" />`,
        `      <vertex x="${image.width}" y="0" z="${-baseHeight}" />`,
        `      <vertex x="${image.width}" y="${image.height}" z="${-baseHeight}" />`,
        `      <vertex x="0" y="${image.height}" z="${-baseHeight}" />`,
        `      <vertex x="0" y="0" z="0" />`,
        `      <vertex x="${image.width}" y="0" z="0" />`,
        `      <vertex x="${image.width}" y="${image.height}" z="0" />`,
        `      <vertex x="0" y="${image.height}" z="0" />`
    ];
    
    const baseTriangles = [
        `      <triangle v1="0" v2="2" v3="1" />`,
        `      <triangle v1="0" v2="3" v3="2" />`,
        `      <triangle v1="4" v2="5" v3="6" />`,
        `      <triangle v1="4" v2="6" v3="7" />`,
        `      <triangle v1="0" v2="1" v3="5" />`,
        `      <triangle v1="0" v2="5" v3="4" />`,
        `      <triangle v1="2" v2="3" v3="7" />`,
        `      <triangle v1="2" v2="7" v3="6" />`,
        `      <triangle v1="3" v2="0" v3="4" />`,
        `      <triangle v1="3" v2="4" v3="7" />`,
        `      <triangle v1="1" v2="2" v3="6" />`,
        `      <triangle v1="1" v2="6" v3="5" />`
    ];
    
    components.push(`    <object id="${meshId}" type="model">
  <mesh:mesh>
    <mesh:vertices>
${baseVertices.join('\n')}
    </mesh:vertices>
    <mesh:triangles>
${baseTriangles.join('\n')}
    </mesh:triangles>
  </mesh:mesh>
    </object>`);
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" xmlns:mesh="http://schemas.microsoft.com/3dmanufacturing/beamlattice/2017/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <resources>
    <base:basematerials id="1">
${materials.join('\n')}
    </base:basematerials>
${components.join('\n')}
    <build>
${components.map((_, i) => `      <item objectid="${i + 1}" />`).join('\n')}
    </build>
  </resources>
</model>`;
    
    // Create 3MF package (ZIP file)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`);
    
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        downloadBlob(blob, "model.3mf");
    });
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { pixelHeight } = settings;
    const zip = new JSZip();
    
    // Generate one PNG per color
    const imagePromises: Promise<void>[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Create black and white mask
        const imageData = ctx.createImageData(image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                const value = isThisColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`mask_${colorIndex}_${colorName}.png`, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    }
    
    await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Image size: ${image.width}x${image.height}

`;
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hexColor = colorEntryToHex(part.target);
        const r = parseInt(hexColor.substring(1, 3), 16) / 255;
        const g = parseInt(hexColor.substring(3, 5), 16) / 255;
        const b = parseInt(hexColor.substring(5, 7), 16) / 255;
        
        scadContent += `// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIndex * 0.01}])
surface(file = "mask_${colorIndex}_${colorName}.png", center = false, invert = true);

`;
    }
    
    scadContent += `// Adjust the scale and height as needed
// Each pixel becomes a 1x1 unit in OpenSCAD
// You can scale this model with: scale([desired_width/${image.width}, desired_height/${image.height}, desired_z_height])
`;
    
    zip.file("model.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "openscad_masks.zip");
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
