import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const saveAs: typeof import("file-saver").saveAs;

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = create3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

export function generateOpenSCADMasks(image: PartListImage, filename: string): void {
    loadJSZipAnd(() => {
        generateOpenSCADMasksWorker(image, filename);
    });
}

function loadJSZipAnd(func: () => void): void {
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
}

function create3MFContent(image: PartListImage): string {
    const heightScale = 1.0;

    const colorObjects: Array<{ 
        pid: number; 
        vertices: string[]; 
        triangles: string[];
    }> = [];

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelColorIdx = image.pixels[y][x];
                if (pixelColorIdx !== colorIdx) continue;

                const baseId = vertexId;
                
                // Bottom vertices (z=0)
                vertices.push(`<vertex x="${x}" y="${y}" z="0" />`);
                vertices.push(`<vertex x="${x + 1}" y="${y}" z="0" />`);
                vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                vertices.push(`<vertex x="${x}" y="${y + 1}" z="0" />`);
                
                // Top vertices (z=heightScale)
                vertices.push(`<vertex x="${x}" y="${y}" z="${heightScale}" />`);
                vertices.push(`<vertex x="${x + 1}" y="${y}" z="${heightScale}" />`);
                vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="${heightScale}" />`);
                vertices.push(`<vertex x="${x}" y="${y + 1}" z="${heightScale}" />`);

                // Bottom face (2 triangles)
                triangles.push(`<triangle v1="${baseId}" v2="${baseId + 2}" v3="${baseId + 1}" />`);
                triangles.push(`<triangle v1="${baseId}" v2="${baseId + 3}" v3="${baseId + 2}" />`);

                // Top face (2 triangles)
                triangles.push(`<triangle v1="${baseId + 4}" v2="${baseId + 5}" v3="${baseId + 6}" />`);
                triangles.push(`<triangle v1="${baseId + 4}" v2="${baseId + 6}" v3="${baseId + 7}" />`);

                // Side faces (4 sides × 2 triangles = 8 triangles)
                // Front
                triangles.push(`<triangle v1="${baseId}" v2="${baseId + 1}" v3="${baseId + 5}" />`);
                triangles.push(`<triangle v1="${baseId}" v2="${baseId + 5}" v3="${baseId + 4}" />`);
                // Right
                triangles.push(`<triangle v1="${baseId + 1}" v2="${baseId + 2}" v3="${baseId + 6}" />`);
                triangles.push(`<triangle v1="${baseId + 1}" v2="${baseId + 6}" v3="${baseId + 5}" />`);
                // Back
                triangles.push(`<triangle v1="${baseId + 2}" v2="${baseId + 3}" v3="${baseId + 7}" />`);
                triangles.push(`<triangle v1="${baseId + 2}" v2="${baseId + 7}" v3="${baseId + 6}" />`);
                // Left
                triangles.push(`<triangle v1="${baseId + 3}" v2="${baseId}" v3="${baseId + 4}" />`);
                triangles.push(`<triangle v1="${baseId + 3}" v2="${baseId + 4}" v3="${baseId + 7}" />`);

                vertexId += 8;
            }
        }

        if (vertices.length > 0) {
            colorObjects.push({ 
                pid: colorIdx + 2, 
                vertices, 
                triangles 
            });
        }
    }

    const baseMaterials = image.partList.map((part, idx) => {
        const hex = colorEntryToHex(part.target);
        return `<base name="${part.target.name}" displaycolor="${hex}" />`;
    }).join('\n    ');

    const objectsXml = colorObjects.map(obj => 
        `<object id="${obj.pid}" name="Color_${image.partList[obj.pid - 2].target.name}" type="model" pid="1" pindex="${obj.pid - 2}">
    <mesh>
        <vertices>
            ${obj.vertices.join('\n            ')}
        </vertices>
        <triangles>
            ${obj.triangles.join('\n            ')}
        </triangles>
    </mesh>
</object>`
    ).join('\n    ');

    const itemsXml = colorObjects.map(obj => 
        `<item objectid="${obj.pid}" />`
    ).join('\n        ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
    ${baseMaterials}
    </basematerials>
    ${objectsXml}
  </resources>
  <build>
        ${itemsXml}
  </build>
</model>`;
}

function generateOpenSCADMasksWorker(image: PartListImage, filename: string): void {
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();

    const scadLines: string[] = [];
    scadLines.push("// OpenSCAD file generated by firaga.io");
    scadLines.push(`// Image: ${filename}`);
    scadLines.push(`width = ${image.width};`);
    scadLines.push(`height = ${image.height};`);
    scadLines.push("layer_height = 1;");
    scadLines.push("");

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const maskFilename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        
        const maskImage = createMaskImage(image, colorIdx);
        const maskBlob = dataURLToBlob(maskImage);
        zip.file(maskFilename, maskBlob);

        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        scadLines.push(`// ${part.target.name}`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  translate([0, 0, ${colorIdx * 1}])`);
        scadLines.push(`    surface(file = "${maskFilename}", center = true, invert = true);`);
        scadLines.push("");
    }

    zip.file(`${filename}.scad`, scadLines.join('\n'));

    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        saveAs(blob, `${filename}_openscad.zip`);
    });
}

function createMaskImage(image: PartListImage, colorIdx: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelColorIdx = image.pixels[y][x];
            
            if (pixelColorIdx === colorIdx) {
                imageData.data[idx] = 255;     // R
                imageData.data[idx + 1] = 255; // G
                imageData.data[idx + 2] = 255; // B
                imageData.data[idx + 3] = 255; // A
            } else {
                imageData.data[idx] = 0;       // R
                imageData.data[idx + 1] = 0;   // G
                imageData.data[idx + 2] = 0;   // B
                imageData.data[idx + 3] = 255; // A
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)![1];
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
}
