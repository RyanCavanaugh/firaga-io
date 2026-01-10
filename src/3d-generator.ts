import { PartListImage } from "./image-utils";
import { colorEntryToHex, nameOfColor } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    thickness: number;
    pixelSize: number;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const modelXml = generate3MFModel(image, settings);
    zip.file("3D/3dmodel.model", modelXml);

    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.file("_rels/.rels", relsXml);

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file("[Content_Types].xml", contentTypesXml);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, thickness } = settings;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).slice(1);
        xml += `      <base name="${nameOfColor(color)}" displaycolor="#${hex}" />\n`;
    }

    xml += `    </basematerials>\n`;

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const objectId = colorIdx + 2;
        xml += `    <object id="${objectId}" type="model">\n`;
        xml += `      <mesh>\n        <vertices>\n`;

        const vertices: Array<[number, number, number]> = [];
        const triangles: number[][] = [];

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = thickness;

                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
                    );

                    const faces = [
                        [0, 2, 1], [0, 3, 2],
                        [4, 5, 6], [4, 6, 7],
                        [0, 1, 5], [0, 5, 4],
                        [1, 2, 6], [1, 6, 5],
                        [2, 3, 7], [2, 7, 6],
                        [3, 0, 4], [3, 4, 7]
                    ];

                    for (const face of faces) {
                        triangles.push([baseIdx + face[0], baseIdx + face[1], baseIdx + face[2]]);
                    }
                }
            }
        }

        for (const v of vertices) {
            xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
        }

        xml += `        </vertices>\n        <triangles>\n`;

        for (const tri of triangles) {
            xml += `          <triangle v1="${tri[0]}" v2="${tri[1]}" v3="${tri[2]}" pid="1" p1="${colorIdx}" />\n`;
        }

        xml += `        </triangles>\n      </mesh>\n    </object>\n`;
    }

    xml += `  </resources>\n  <build>\n`;

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const objectId = colorIdx + 2;
        xml += `    <item objectid="${objectId}" />\n`;
    }

    xml += `  </build>\n</model>`;

    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext("2d")!;

        const imageData = ctx.createImageData(image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                const value = isThisColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
            maskCanvas.toBlob((b) => resolve(b!), "image/png");
        });

        const colorName = sanitizeFilename(nameOfColor(image.partList[colorIdx].target));
        zip.file(`mask_${colorIdx}_${colorName}.png`, blob);
    }

    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, thickness } = settings;
    let scad = `// Generated by firaga.io
// Pixel art 3D model using heightmaps

`;

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorName = sanitizeFilename(nameOfColor(image.partList[colorIdx].target));
        const hex = colorEntryToHex(image.partList[colorIdx].target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        scad += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scad += `  scale([${pixelSize}, ${pixelSize}, ${thickness}])\n`;
        scad += `    surface(file = "mask_${colorIdx}_${colorName}.png", center = true, invert = false);\n\n`;
    }

    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
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

async function loadJSZip(): Promise<typeof import("jszip")> {
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
    
    return (window as any).JSZip;
}
