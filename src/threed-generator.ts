import { PartListImage } from "./image-utils";
import { colorEntryToHex, getPitch } from "./utils";

declare const JSZip: typeof import("jszip");

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    gridSize: string;
    filename: string;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const pitch = getPitch(settings.gridSize);
    const height = 2; // mm height per layer
    
    // Build 3MF XML structure
    let modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
`;

    // Add materials for each color
    const baseMaterialsXml = image.partList.map((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        return `    <basematerials id="${idx + 1}">
      <base name="${part.target.name}" displaycolor="#${hex}" />
    </basematerials>`;
    }).join('\n');
    
    modelXml += baseMaterialsXml + '\n';

    // Create mesh objects for each color
    let vertexOffset = 0;
    const objects: string[] = [];
    
    image.partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexIndex = 0;

        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;

                    // 8 vertices for a cube
                    const baseIdx = localVertexIndex;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    localVertexIndex += 8;

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                }
            }
        }

        if (vertices.length > 0) {
            const objectId = partIndex + 100;
            objects.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    });

    modelXml += objects.join('\n') + '\n';
    modelXml += `  </resources>
  <build>
`;

    // Add build items with materials
    image.partList.forEach((part, idx) => {
        const objectId = idx + 100;
        const materialId = idx + 1;
        modelXml += `    <item objectid="${objectId}" partnumber="${idx}" />\n`;
    });

    modelXml += `  </build>
</model>`;

    // Create 3MF package (zip file)
    const zip = new JSZip();
    
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
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`;
    
    zip.folder("_rels")?.file(".rels", rels);
    
    // Add 3D/3dmodel.model
    zip.folder("3D")?.file("3dmodel.model", modelXml);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const pitch = getPitch(settings.gridSize);
    const zip = new JSZip();
    
    // Generate one PNG per color
    const imagePromises = image.partList.map(async (part, partIndex) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white by default
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black where this color appears
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        return new Promise<{ name: string; blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const sanitizedName = part.target.name.replace(/[^a-z0-9]/gi, '_');
                resolve({ name: `color_${partIndex}_${sanitizedName}.png`, blob: blob! });
            });
        });
    });
    
    const imageFiles = await Promise.all(imagePromises);
    
    // Add images to zip
    imageFiles.forEach(({ name, blob }) => {
        zip.file(name, blob);
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel art 3D display using heightmaps

pitch = ${pitch}; // mm per pixel
layer_height = 2; // mm per layer

`;

    // Add modules for each color
    image.partList.forEach((part, idx) => {
        const { name } = imageFiles[idx];
        const hex = colorEntryToHex(part.target);
        const [r, g, b] = hexToRgb(hex);
        
        scadContent += `// ${part.target.name}
module layer_${idx}() {
    color([${r}, ${g}, ${b}])
    scale([pitch, pitch, layer_height])
    surface(file = "${name}", center = true, invert = true);
}

`;
    });
    
    // Combine all layers
    scadContent += `// Combine all layers
union() {
`;
    
    image.partList.forEach((_, idx) => {
        scadContent += `    translate([0, 0, ${idx * 0.01}]) layer_${idx}();\n`;
    });
    
    scadContent += `}\n`;
    
    zip.file("model.scad", scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ];
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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
