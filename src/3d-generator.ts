import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const pitch = settings.pitch;
    const height = settings.height;

    let objectId = 1;
    const objectsXML: string[] = [];
    const buildItems: string[] = [];

    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<[number, number, number]> = [];

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;

                    const baseIdx = vertices.length;
                    
                    vertices.push(
                        { x: x0, y: y0, z: z0 },
                        { x: x1, y: y0, z: z0 },
                        { x: x1, y: y1, z: z0 },
                        { x: x0, y: y1, z: z0 },
                        { x: x0, y: y0, z: z1 },
                        { x: x1, y: y0, z: z1 },
                        { x: x1, y: y1, z: z1 },
                        { x: x0, y: y1, z: z1 }
                    );

                    triangles.push(
                        [baseIdx + 0, baseIdx + 1, baseIdx + 2], [baseIdx + 0, baseIdx + 2, baseIdx + 3],
                        [baseIdx + 4, baseIdx + 6, baseIdx + 5], [baseIdx + 4, baseIdx + 7, baseIdx + 6],
                        [baseIdx + 0, baseIdx + 4, baseIdx + 5], [baseIdx + 0, baseIdx + 5, baseIdx + 1],
                        [baseIdx + 1, baseIdx + 5, baseIdx + 6], [baseIdx + 1, baseIdx + 6, baseIdx + 2],
                        [baseIdx + 2, baseIdx + 6, baseIdx + 7], [baseIdx + 2, baseIdx + 7, baseIdx + 3],
                        [baseIdx + 3, baseIdx + 7, baseIdx + 4], [baseIdx + 3, baseIdx + 4, baseIdx + 0]
                    );
                }
            }
        }

        if (vertices.length > 0) {
            const verticesXML = vertices
                .map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`)
                .join("\n");
            const trianglesXML = triangles
                .map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`)
                .join("\n");

            const colorHex = rgbToHex(part.target.r, part.target.g, part.target.b);

            objectsXML.push(`
    <object id="${objectId}" name="${escapeXML(part.target.name)}" type="model">
      <mesh>
        <vertices>
${verticesXML}
        </vertices>
        <triangles>
${trianglesXML}
        </triangles>
      </mesh>
    </object>`);

            buildItems.push(`      <item objectid="${objectId}" />`);
            objectId++;
        }
    }

    const modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXML.join("\n")}
  </resources>
  <build>
${buildItems.join("\n")}
  </build>
</model>`;

    const zip = new JSZip();
    zip.file("3D/3dmodel.model", modelXML);
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
    saveAs(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    const pitch = settings.pitch;
    const height = settings.height;

    const scadLines: string[] = [];
    scadLines.push(`// Generated OpenSCAD file for ${settings.filename}`);
    scadLines.push(`// Image size: ${image.width}x${image.height}`);
    scadLines.push(`pitch = ${pitch};`);
    scadLines.push(`height = ${height};`);
    scadLines.push("");

    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) continue;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const imageData = await canvasToDataURL(canvas);
        const base64Data = imageData.split(",")[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let j = 0; j < binaryData.length; j++) {
            bytes[j] = binaryData.charCodeAt(j);
        }

        const filename = `mask_${part.symbol}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, bytes);

        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;

        scadLines.push(`// ${part.target.name} (${part.count} pixels)`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  translate([0, 0, ${i * height}])`);
        scadLines.push(`    scale([pitch, pitch, height])`);
        scadLines.push(`      surface(file = "${filename}", center = true, invert = true);`);
        scadLines.push("");
    }

    const scadContent = scadLines.join("\n");
    zip.file(`${settings.filename}.scad`, scadContent);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function escapeXML(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "&": return "&amp;";
            case "'": return "&apos;";
            case "\"": return "&quot;";
            default: return c;
        }
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function canvasToDataURL(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve) => {
        resolve(canvas.toDataURL("image/png"));
    });
}
