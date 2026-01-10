import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    height: number;
    filename: string;
};

export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const vertices: Array<[number, number, number]> = [];
    const triangles: Array<{ v1: number; v2: number; v3: number; pid: number }> = [];
    
    // Build a heightmap-based mesh where each pixel becomes a colored block
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const partIndex = image.pixels[y][x];
            if (partIndex === -1) continue;
            
            // Create a box for this pixel
            const baseIndex = vertices.length;
            const z0 = 0;
            const z1 = settings.height;
            
            // 8 vertices of the box
            vertices.push([x, y, z0]);
            vertices.push([x + 1, y, z0]);
            vertices.push([x + 1, y + 1, z0]);
            vertices.push([x, y + 1, z0]);
            vertices.push([x, y, z1]);
            vertices.push([x + 1, y, z1]);
            vertices.push([x + 1, y + 1, z1]);
            vertices.push([x, y + 1, z1]);
            
            // 12 triangles (2 per face, 6 faces)
            const faces = [
                [0, 1, 2], [0, 2, 3], // bottom
                [4, 6, 5], [4, 7, 6], // top
                [0, 4, 5], [0, 5, 1], // front
                [1, 5, 6], [1, 6, 2], // right
                [2, 6, 7], [2, 7, 3], // back
                [3, 7, 4], [3, 4, 0], // left
            ];
            
            for (const face of faces) {
                triangles.push({
                    v1: baseIndex + face[0],
                    v2: baseIndex + face[1],
                    v3: baseIndex + face[2],
                    pid: partIndex
                });
            }
        }
    }
    
    const xml = build3MFXml(vertices, triangles, image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFXml(
    vertices: ReadonlyArray<readonly [number, number, number]>,
    triangles: ReadonlyArray<{ readonly v1: number; readonly v2: number; readonly v3: number; readonly pid: number }>,
    image: PartListImage,
    settings: ThreeDSettings
): string {
    const colors = image.partList.map(part => colorEntryToHex(part.target));
    
    // Build resources section with base materials
    let baseMaterials = '<basematerials id="1">\n';
    for (let i = 0; i < colors.length; i++) {
        baseMaterials += `  <base name="${escapeXml(image.partList[i].target.name)}" displaycolor="${colors[i].substring(1)}" />\n`;
    }
    baseMaterials += '</basematerials>\n';
    
    // Build mesh
    let meshVertices = '<vertices>\n';
    for (const v of vertices) {
        meshVertices += `  <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
    }
    meshVertices += '</vertices>\n';
    
    let meshTriangles = '<triangles>\n';
    for (const t of triangles) {
        meshTriangles += `  <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${t.pid}" />\n`;
    }
    meshTriangles += '</triangles>\n';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${baseMaterials}
    <object id="2" type="model">
      <mesh>
        ${meshVertices}
        ${meshTriangles}
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="2" />
  </build>
</model>`;
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): void {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
        loadJSZip(() => generateOpenSCADMasks(image, settings));
        return;
    }
    
    const zip = new JSZip();
    
    // Generate one mask image per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === i;
                imageData.data[idx] = isThisColor ? 0 : 255;
                imageData.data[idx + 1] = isThisColor ? 0 : 255;
                imageData.data[idx + 2] = isThisColor ? 0 : 255;
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(`mask_${i}_${sanitizeFilename(part.target.name)}.png`, base64, { base64: true });
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Height map 3D model
height = ${settings.height};

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const filename = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        const color = hexToRgb(colorEntryToHex(part.target));
        
        scadContent += `// ${part.target.name}
color([${color.r}, ${color.g}, ${color.b}])
  surface(file = "${filename}", center = true, invert = true);

`;
    }
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, `${settings.filename}_openscad.zip`);
    });
}

function loadJSZip(callback: () => void): void {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => callback();
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        callback();
    }
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        }
        : { r: 0, g: 0, b: 0 };
}
