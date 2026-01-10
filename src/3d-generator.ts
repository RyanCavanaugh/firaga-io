import { PartListImage } from "./image-utils";
import JSZip from "jszip";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    height: number; // Height in mm for each layer
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const width = image.width;
    const height = image.height;
    const pixelSize = 1; // 1mm per pixel
    const layerHeight = settings.height;

    // Generate XML for 3MF format
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        xml += `      <base name="${color.name}" displaycolor="#${r}${g}${b}" />\n`;
    }

    xml += `    </basematerials>\n`;

    // Generate meshes for each color
    let objectId = 2;
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // For each pixel of this color, create a cube
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = colorIndex * layerHeight;
                    const z1 = (colorIndex + 1) * layerHeight;

                    // 8 vertices of cube
                    const v0 = vertexIndex++;
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    const v1 = vertexIndex++;
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    const v2 = vertexIndex++;
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    const v3 = vertexIndex++;
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    const v4 = vertexIndex++;
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    const v5 = vertexIndex++;
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    const v6 = vertexIndex++;
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    const v7 = vertexIndex++;
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`        <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                    triangles.push(`        <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                    // Top face
                    triangles.push(`        <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`        <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                    // Front face
                    triangles.push(`        <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                    triangles.push(`        <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                    // Back face
                    triangles.push(`        <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                    triangles.push(`        <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                    // Left face
                    triangles.push(`        <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`);
                    triangles.push(`        <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`);
                    // Right face
                    triangles.push(`        <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                    triangles.push(`        <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${objectId}" type="model" materialid="1" materialpropid="${colorIndex}">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            xml += vertices.join('\n') + '\n';
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            xml += triangles.join('\n') + '\n';
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;
            objectId++;
        }
    }

    xml += `  </resources>\n`;
    xml += `  <build>\n`;

    // Add all objects to build
    for (let id = 2; id < objectId; id++) {
        xml += `    <item objectid="${id}" />\n`;
    }

    xml += `  </build>\n`;
    xml += `</model>\n`;

    // Create 3MF file (which is a zip file)
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

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.filename}.3mf`;
    a.click();
    URL.revokeObjectURL(url);
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const width = image.width;
    const height = image.height;
    const layerHeight = settings.height;

    // Create a monochrome PNG for each color
    const colorFiles: string[] = [];
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);

        // Fill with white (transparent) and black (filled)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (image.pixels[y][x] === colorIndex) {
                    // Black for filled pixels
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                } else {
                    // White for empty pixels
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });

        const color = image.partList[colorIndex].target;
        const filename = `layer_${colorIndex}_${color.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        colorFiles.push(filename);
        zip.file(filename, blob);
    }

    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Layer height: ${layerHeight}mm

`;

    for (let i = 0; i < colorFiles.length; i++) {
        const color = image.partList[i].target;
        scadContent += `// ${color.name} (${color.code || 'no code'})
module layer_${i}() {
    color([${color.r / 255}, ${color.g / 255}, ${color.b / 255}])
    translate([0, 0, ${i * layerHeight}])
    surface(file = "${colorFiles[i]}", center = true, invert = true);
}

`;
    }

    scadContent += `// Combine all layers
union() {
`;
    for (let i = 0; i < colorFiles.length; i++) {
        scadContent += `    layer_${i}();\n`;
    }
    scadContent += `}\n`;

    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.filename}_openscad.zip`;
    a.click();
    URL.revokeObjectURL(url);
}
