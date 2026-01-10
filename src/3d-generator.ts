import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    thickness: number;
    pitch: number;
    filename: string;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCAD(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZipAnd(async () => {
        const zip = new JSZip();
        
        // Create 3MF content
        const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
        
        const relsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

        // Build the 3D model XML
        let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2014/07">
  <resources>
    <basematerials id="1">`;

        // Add materials for each color
        image.partList.forEach((part, idx) => {
            const hex = colorEntryToHex(part.target).substring(1); // Remove #
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            modelXml += `
      <base name="${part.target.name}" displaycolor="#${hex.toUpperCase()}"/>`;
        });

        modelXml += `
    </basematerials>`;

        // Generate mesh objects for each color
        image.partList.forEach((part, colorIdx) => {
            const vertices: number[][] = [];
            const triangles: number[][] = [];
            let vertexCount = 0;

            // Find all pixels of this color and create boxes
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[y][x] === colorIdx) {
                        // Create a box for this pixel
                        const x0 = x * settings.pitch;
                        const x1 = (x + 1) * settings.pitch;
                        const y0 = y * settings.pitch;
                        const y1 = (y + 1) * settings.pitch;
                        const z0 = 0;
                        const z1 = settings.thickness;

                        const baseIdx = vertexCount;
                        
                        // 8 vertices of the box
                        vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                        vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);

                        // 12 triangles (2 per face, 6 faces)
                        // Bottom face
                        triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                        triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                        // Top face
                        triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                        triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                        // Front face
                        triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                        triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                        // Back face
                        triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                        triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                        // Left face
                        triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                        triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                        // Right face
                        triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                        triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);

                        vertexCount += 8;
                    }
                }
            }

            if (vertices.length > 0) {
                modelXml += `
    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>`;
                
                vertices.forEach(v => {
                    modelXml += `
          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}"/>`;
                });

                modelXml += `
        </vertices>
        <triangles>`;
                
                triangles.forEach(t => {
                    modelXml += `
          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}"/>`;
                });

                modelXml += `
        </triangles>
      </mesh>
    </object>`;
            }
        });

        modelXml += `
  </resources>
  <build>`;

        // Add all objects to the build
        image.partList.forEach((part, colorIdx) => {
            modelXml += `
    <item objectid="${colorIdx + 2}"/>`;
        });

        modelXml += `
  </build>
</model>`;

        // Add files to zip
        zip.file("[Content_Types].xml", contentTypes);
        zip.folder("_rels").file(".rels", relsContent);
        zip.folder("3D").file("3dmodel.model", modelXml);

        // Generate and download
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${settings.filename}.3mf`);
    });
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZipAnd(async () => {
        const zip = new JSZip();

        // Create one black and white image per color
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;

        const imagePromises: Promise<void>[] = [];

        image.partList.forEach((part, colorIdx) => {
            // Clear canvas
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, image.width, image.height);
            
            // Draw black pixels where this color appears
            ctx.fillStyle = "black";
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[y][x] === colorIdx) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }

            // Convert to blob and add to zip
            const promise = new Promise<void>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
                        zip.file(`${colorName}.png`, blob);
                    }
                    resolve();
                });
            });
            imagePromises.push(promise);
        });

        await Promise.all(imagePromises);

        // Create OpenSCAD file
        let scadContent = `// Generated by firaga.io
// 3D heightmap display of image
// Each color is a separate layer

`;

        const layerHeight = settings.thickness / image.partList.length;

        image.partList.forEach((part, colorIdx) => {
            const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
            const hex = colorEntryToHex(part.target).substring(1);
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            scadContent += `
// Layer ${colorIdx + 1}: ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${(colorIdx * layerHeight).toFixed(3)}])
scale([${settings.pitch}, ${settings.pitch}, ${layerHeight}])
surface(file = "${colorName}.png", center = false, invert = true);
`;
        });

        zip.file(`${settings.filename}.scad`, scadContent);

        // Generate and download
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${settings.filename}.zip`);
    });
}

async function loadJSZipAnd(func: () => Promise<void>) {
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
        await func();
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
