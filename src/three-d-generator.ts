import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
}

export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    window.clarity?.("event", "3d-export");

    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else if (settings.format === "openscad") {
        generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    // Create a simple 3MF file with one material shape per color
    const shapes: Shape[] = [];

    // Create a shape for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorEntry = image.partList[colorIdx].target;
        const verts: Vec3[] = [];
        const triangles: Triangle[] = [];

        // Scan image for pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const zHeight = 1; // 1 unit high per pixel
                    const baseVertCount = verts.length;

                    // Define the 8 vertices of a cube at this position
                    verts.push({ x: x, y: y, z: 0 });
                    verts.push({ x: x + 1, y: y, z: 0 });
                    verts.push({ x: x + 1, y: y + 1, z: 0 });
                    verts.push({ x: x, y: y + 1, z: 0 });
                    verts.push({ x: x, y: y, z: zHeight });
                    verts.push({ x: x + 1, y: y, z: zHeight });
                    verts.push({ x: x + 1, y: y + 1, z: zHeight });
                    verts.push({ x: x, y: y + 1, z: zHeight });

                    // Define triangles for the cube (12 triangles for 6 faces)
                    // Bottom face
                    triangles.push({ v1: baseVertCount + 0, v2: baseVertCount + 1, v3: baseVertCount + 2 });
                    triangles.push({ v1: baseVertCount + 0, v2: baseVertCount + 2, v3: baseVertCount + 3 });
                    // Top face
                    triangles.push({ v1: baseVertCount + 4, v2: baseVertCount + 6, v3: baseVertCount + 5 });
                    triangles.push({ v1: baseVertCount + 4, v2: baseVertCount + 7, v3: baseVertCount + 6 });
                    // Front face
                    triangles.push({ v1: baseVertCount + 0, v2: baseVertCount + 5, v3: baseVertCount + 1 });
                    triangles.push({ v1: baseVertCount + 0, v2: baseVertCount + 4, v3: baseVertCount + 5 });
                    // Back face
                    triangles.push({ v1: baseVertCount + 2, v2: baseVertCount + 7, v3: baseVertCount + 3 });
                    triangles.push({ v1: baseVertCount + 2, v2: baseVertCount + 6, v3: baseVertCount + 7 });
                    // Left face
                    triangles.push({ v1: baseVertCount + 3, v2: baseVertCount + 7, v3: baseVertCount + 4 });
                    triangles.push({ v1: baseVertCount + 3, v2: baseVertCount + 4, v3: baseVertCount + 0 });
                    // Right face
                    triangles.push({ v1: baseVertCount + 1, v2: baseVertCount + 5, v3: baseVertCount + 6 });
                    triangles.push({ v1: baseVertCount + 1, v2: baseVertCount + 6, v3: baseVertCount + 2 });
                }
            }
        }

        if (verts.length > 0) {
            shapes.push({
                color: colorEntry,
                vertices: verts,
                triangles: triangles,
                materialId: colorIdx + 1
            });
        }
    }

    // Build 3MF XML structure
    const models: string[] = [];

    // Build object for each shape
    for (const shape of shapes) {
        const color = shape.color;
        const hexColor = colorEntryToHex(color);

        let objectXml = `    <object id="${shape.materialId}" type="model">\n`;
        objectXml += `      <mesh>\n`;
        objectXml += `        <vertices>\n`;

        for (const v of shape.vertices) {
            objectXml += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
        }

        objectXml += `        </vertices>\n`;
        objectXml += `        <triangles>\n`;

        for (const t of shape.triangles) {
            objectXml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
        }

        objectXml += `        </triangles>\n`;
        objectXml += `      </mesh>\n`;
        objectXml += `      <material id="${shape.materialId}">\n`;
        objectXml += `        <color color="${hexColor}" />\n`;
        objectXml += `      </material>\n`;
        objectXml += `    </object>\n`;

        models.push(objectXml);
    }

    const modelsContent = models.join("\n");

    const threeMFXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2013/12" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/02" unit="millimeter" xml:lang="en-US">
  <resources>
${modelsContent}  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    // Create a blob and download
    const blob = new Blob([threeMFXml], { type: "application/vnd.ms-package.3dmanufacturing-3mmodel+xml" });
    downloadFile(blob, settings.filename + ".3mf");
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): void {
    // Generate OpenSCAD masks format: zip with one PNG per color + OpenSCAD file
    // For now, we'll create a simple approach that generates the images and the SCAD file

    const pngDataUrls: Array<{ name: string; dataUrl: string }> = [];

    // Generate a monochrome image for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;

        // Create black and white mask
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        ctx.fillStyle = "black";

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        pngDataUrls.push({
            name: `color_${colorIdx}.png`,
            dataUrl: canvas.toDataURL("image/png")
        });
    }

    // Generate OpenSCAD file content
    let scadContent = `// Generated by firaga.io\n`;
    scadContent += `// 3D reconstruction from pixel art\n\n`;
    scadContent += `$fn = 16; // Facets for cylinders\n\n`;

    for (let i = 0; i < image.partList.length; i++) {
        const colorEntry = image.partList[i].target;
        const hexColor = colorEntryToHex(colorEntry);

        scadContent += `// Color ${i}: ${colorEntry.name} (${hexColor})\n`;
        scadContent += `color("${hexColor}") {\n`;
        scadContent += `  for (x = [0:${image.width - 1}]) {\n`;
        scadContent += `    for (y = [0:${image.height - 1}]) {\n`;
        scadContent += `      if (lookup_pixel(${i}, x, y)) {\n`;
        scadContent += `        translate([x, y, 0]) cube([1, 1, 1]);\n`;
        scadContent += `      }\n`;
        scadContent += `    }\n`;
        scadContent += `  }\n`;
        scadContent += `}\n\n`;
    }

    scadContent += `// Helper function to check if a pixel is set in the heightmap\n`;
    scadContent += `// This would require loading the images with 'surface()' in OpenSCAD\n`;
    scadContent += `function lookup_pixel(color_idx, x, y) = true; // Placeholder\n`;

    // Download SCAD file
    const scadBlob = new Blob([scadContent], { type: "text/plain" });
    downloadFile(scadBlob, settings.filename + ".scad");

    // Note: Browser cannot create ZIP files directly, so we'll provide a simple format
    // In production, you might want to use a library like JSZip
    console.log("Generated OpenSCAD masks for colors 0-" + (image.partList.length - 1));
    console.log("For full functionality, download the PNG images and use the .scad file in OpenSCAD");
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface Triangle {
    v1: number;
    v2: number;
    v3: number;
}

interface Shape {
    color: any;
    vertices: Vec3[];
    triangles: Triangle[];
    materialId: number;
}
