import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { vertices, triangles, materials } = build3DMesh(image, settings);
    const xml = create3MFDocument(vertices, triangles, materials, image);
    downloadFile(xml, `${settings.filename}.3mf`, "model/3mf");
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImage = createMaskImage(image, i);
        const blob = await canvasToBlob(maskImage);
        zip.file(`mask_${i}_${sanitizeFilename(part.target.name)}.png`, blob);
    }
    
    const scadContent = createOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadFile(zipBlob, `${settings.filename}_openscad.zip`, "application/zip");
}

type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number; materialId: number };
type Material = { id: number; name: string; color: string };

function build3DMesh(image: PartListImage, settings: ThreeDSettings): {
    vertices: Vertex[];
    triangles: Triangle[];
    materials: Material[];
} {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    const materials: Material[] = image.partList.map((part, idx) => ({
        id: idx,
        name: part.target.name,
        color: colorEntryToHex(part.target)
    }));
    
    const pw = settings.pixelWidth;
    const ph = settings.pixelHeight;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelValue = image.pixels[y][x];
            if (pixelValue === undefined) continue;
            
            const baseIdx = vertices.length;
            const x0 = x * pw;
            const x1 = (x + 1) * pw;
            const y0 = y * ph;
            const y1 = (y + 1) * ph;
            const z0 = 0;
            const z1 = ph;
            
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
            
            const materialId = pixelValue;
            
            triangles.push(
                { v1: baseIdx + 0, v2: baseIdx + 1, v3: baseIdx + 2, materialId },
                { v1: baseIdx + 0, v2: baseIdx + 2, v3: baseIdx + 3, materialId },
                { v1: baseIdx + 4, v2: baseIdx + 6, v3: baseIdx + 5, materialId },
                { v1: baseIdx + 4, v2: baseIdx + 7, v3: baseIdx + 6, materialId },
                { v1: baseIdx + 0, v2: baseIdx + 5, v3: baseIdx + 1, materialId },
                { v1: baseIdx + 0, v2: baseIdx + 4, v3: baseIdx + 5, materialId },
                { v1: baseIdx + 1, v2: baseIdx + 6, v3: baseIdx + 2, materialId },
                { v1: baseIdx + 1, v2: baseIdx + 5, v3: baseIdx + 6, materialId },
                { v1: baseIdx + 2, v2: baseIdx + 7, v3: baseIdx + 3, materialId },
                { v1: baseIdx + 2, v2: baseIdx + 6, v3: baseIdx + 7, materialId },
                { v1: baseIdx + 3, v2: baseIdx + 4, v3: baseIdx + 0, materialId },
                { v1: baseIdx + 3, v2: baseIdx + 7, v3: baseIdx + 4, materialId }
            );
        }
    }
    
    return { vertices, triangles, materials };
}

function create3MFDocument(
    vertices: Vertex[],
    triangles: Triangle[],
    materials: Material[],
    image: PartListImage
): string {
    const materialsByGroup = new Map<number, Triangle[]>();
    for (const tri of triangles) {
        const group = materialsByGroup.get(tri.materialId) ?? [];
        group.push(tri);
        materialsByGroup.set(tri.materialId, group);
    }
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    for (const mat of materials) {
        xml += `\n      <base name="${escapeXml(mat.name)}" displaycolor="${mat.color.replace('#', '')}" />`;
    }
    
    xml += `\n    </basematerials>`;
    
    for (const [matId, tris] of materialsByGroup.entries()) {
        xml += `\n    <object id="${matId + 2}" type="model">
      <mesh>
        <vertices>`;
        
        const vertexMap = new Map<number, number>();
        let localIdx = 0;
        for (const tri of tris) {
            for (const vIdx of [tri.v1, tri.v2, tri.v3]) {
                if (!vertexMap.has(vIdx)) {
                    const v = vertices[vIdx];
                    xml += `\n          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`;
                    vertexMap.set(vIdx, localIdx++);
                }
            }
        }
        
        xml += `\n        </vertices>
        <triangles>`;
        
        for (const tri of tris) {
            const v1 = vertexMap.get(tri.v1)!;
            const v2 = vertexMap.get(tri.v2)!;
            const v3 = vertexMap.get(tri.v3)!;
            xml += `\n          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${matId}" />`;
        }
        
        xml += `\n        </triangles>
      </mesh>
    </object>`;
    }
    
    xml += `\n  </resources>
  <build>`;
    
    for (const matId of materialsByGroup.keys()) {
        xml += `\n    <item objectid="${matId + 2}" />`;
    }
    
    xml += `\n  </build>
</model>`;
    
    return xml;
}

function createMaskImage(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelValue = image.pixels[y][x];
            const idx = (y * image.width + x) * 4;
            
            if (pixelValue === colorIndex) {
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 255;
            } else {
                imageData.data[idx] = 255;
                imageData.data[idx + 1] = 255;
                imageData.data[idx + 2] = 255;
                imageData.data[idx + 3] = 255;
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function createOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const pw = settings.pixelWidth;
    const ph = settings.pixelHeight;
    
    let scad = `// Generated by firaga.io
// Image size: ${image.width}x${image.height}
// Pixel dimensions: ${pw}mm x ${ph}mm

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const filename = `mask_${i}_${sanitizeFilename(part.target.name)}.png`;
        const colorRgb = hexToRgb(colorEntryToHex(part.target));
        
        scad += `// ${part.target.name} (${part.count} pixels)
color([${colorRgb.r / 255}, ${colorRgb.g / 255}, ${colorRgb.b / 255}])
  surface(file = "${filename}", center = true, invert = true);

`;
    }
    
    return scad;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob from canvas"));
            }
        });
    });
}

function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : { r: 0, g: 0, b: 0 };
}

async function loadJSZip(): Promise<any> {
    const script = document.getElementById("jszip-script");
    if (!script) {
        return new Promise((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = "jszip-script";
            tag.onload = () => {
                resolve((window as any).JSZip);
            };
            tag.onerror = reject;
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
    return (window as any).JSZip;
}
