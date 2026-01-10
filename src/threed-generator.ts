import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    heightPerLayer: number;
    baseHeight: number;
    filename: string;
};

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZip();
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCAD(image, settings);
    }
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        await new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + ".3mf");
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pixels, width, height, partList } = image;
    const pixelSize = 1.0;
    const baseHeight = settings.baseHeight;
    const heightPerLayer = settings.heightPerLayer;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    const colorToMaterialId: Map<number, number> = new Map();
    let materialId = 0;
    
    partList.forEach((part, idx) => {
        if (part) {
            const hex = colorEntryToHex(part).substring(1);
            colorToMaterialId.set(idx, materialId);
            xml += `\n      <base name="${part.name}" displaycolor="#${hex}" />`;
            materialId++;
        }
    });
    
    xml += `\n    </basematerials>\n`;
    
    let objectId = 2;
    partList.forEach((part, partIdx) => {
        if (!part) return;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;
        const matId = colorToMaterialId.get(partIdx);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight;
                    const z1 = baseHeight + heightPerLayer;
                    
                    const v0 = vertexId++;
                    const v1 = vertexId++;
                    const v2 = vertexId++;
                    const v3 = vertexId++;
                    const v4 = vertexId++;
                    const v5 = vertexId++;
                    const v6 = vertexId++;
                    const v7 = vertexId++;
                    
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    triangles.push(`<triangle v1="${v0}" v2="${v1}" v3="${v2}" />`);
                    triangles.push(`<triangle v1="${v0}" v2="${v2}" v3="${v3}" />`);
                    triangles.push(`<triangle v1="${v4}" v2="${v6}" v3="${v5}" />`);
                    triangles.push(`<triangle v1="${v4}" v2="${v7}" v3="${v6}" />`);
                    triangles.push(`<triangle v1="${v0}" v2="${v4}" v3="${v5}" />`);
                    triangles.push(`<triangle v1="${v0}" v2="${v5}" v3="${v1}" />`);
                    triangles.push(`<triangle v1="${v1}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`<triangle v1="${v1}" v2="${v6}" v3="${v2}" />`);
                    triangles.push(`<triangle v1="${v2}" v2="${v6}" v3="${v7}" />`);
                    triangles.push(`<triangle v1="${v2}" v2="${v7}" v3="${v3}" />`);
                    triangles.push(`<triangle v1="${v3}" v2="${v7}" v3="${v4}" />`);
                    triangles.push(`<triangle v1="${v3}" v2="${v4}" v3="${v0}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${objectId}" type="model" pid="1" pindex="${matId}">
      <mesh>
        <vertices>
${vertices.map(v => '          ' + v).join('\n')}
        </vertices>
        <triangles>
${triangles.map(t => '          ' + t).join('\n')}
        </triangles>
      </mesh>
    </object>\n`;
            objectId++;
        }
    });
    
    xml += `  </resources>
  <build>`;
    
    for (let i = 2; i < objectId; i++) {
        xml += `\n    <item objectid="${i}" />`;
    }
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

async function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { pixels, width, height, partList } = image;
    const zip = new JSZip();
    
    const colorImages: Map<number, boolean[][]> = new Map();
    
    partList.forEach((part, idx) => {
        if (part) {
            const mask: boolean[][] = [];
            for (let y = 0; y < height; y++) {
                const row: boolean[] = [];
                for (let x = 0; x < width; x++) {
                    row.push(pixels[y][x] === idx);
                }
                mask.push(row);
            }
            colorImages.set(idx, mask);
        }
    });
    
    const scadParts: string[] = [];
    scadParts.push('// Generated by firaga.io');
    scadParts.push(`pixel_size = 1;`);
    scadParts.push(`base_height = ${settings.baseHeight};`);
    scadParts.push(`height_per_layer = ${settings.heightPerLayer};`);
    scadParts.push('');
    
    colorImages.forEach((mask, idx) => {
        const part = partList[idx];
        if (!part) return;
        
        const filename = `color_${idx}.png`;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const value = mask[y][x] ? 255 : 0;
                imageData.data[i] = value;
                imageData.data[i + 1] = value;
                imageData.data[i + 2] = value;
                imageData.data[i + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
            if (blob) {
                zip.file(filename, blob);
            }
        });
        
        const hex = colorEntryToHex(part);
        scadParts.push(`// ${part.name}`);
        scadParts.push(`color("${hex}")`);
        scadParts.push(`  translate([0, 0, base_height])`);
        scadParts.push(`    surface(file = "${filename}", center = true, invert = true);`);
        scadParts.push('');
    });
    
    const scadContent = scadParts.join('\n');
    zip.file(settings.filename + '.scad', scadContent);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + "_openscad.zip");
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
