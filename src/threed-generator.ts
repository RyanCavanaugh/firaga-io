import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
};

// Minimal types for JSZip from CDN
interface JSZipFile {
    file(name: string, data: Blob | string): void;
    generateAsync(options: { type: 'blob' }): Promise<Blob>;
}

declare const JSZip: {
    new(): JSZipFile;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const blockHeight = settings.height;

    let vertexId = 1;
    const objects: string[] = [];
    
    // Create a mesh for each color
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        
        // For each pixel of this color, create a cube
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = blockHeight;
                    
                    // 8 vertices of the cube
                    const baseId = localVertexId;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 2}" v3="${baseId + 1}"/>`);
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 3}" v3="${baseId + 2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseId + 4}" v2="${baseId + 5}" v3="${baseId + 6}"/>`);
                    triangles.push(`<triangle v1="${baseId + 4}" v2="${baseId + 6}" v3="${baseId + 7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 1}" v3="${baseId + 5}"/>`);
                    triangles.push(`<triangle v1="${baseId + 0}" v2="${baseId + 5}" v3="${baseId + 4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseId + 2}" v2="${baseId + 3}" v3="${baseId + 7}"/>`);
                    triangles.push(`<triangle v1="${baseId + 2}" v2="${baseId + 7}" v3="${baseId + 6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseId + 3}" v2="${baseId + 0}" v3="${baseId + 4}"/>`);
                    triangles.push(`<triangle v1="${baseId + 3}" v2="${baseId + 4}" v3="${baseId + 7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseId + 1}" v2="${baseId + 2}" v3="${baseId + 6}"/>`);
                    triangles.push(`<triangle v1="${baseId + 1}" v2="${baseId + 6}" v3="${baseId + 5}"/>`);
                    
                    localVertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const color = part.target;
            const hexColor = colorEntryToHex(color).substring(1); // Remove #
            const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
            
            objects.push(`
    <object id="${vertexId}" name="${colorName}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>
    <item objectid="${vertexId}" transform="1 0 0 0 1 0 0 0 1 0 0 0">
      <metadatagroup>
        <metadata name="color">#${hexColor}</metadata>
      </metadatagroup>
    </item>`);
            vertexId++;
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${objects.join('\n    ')}
  </resources>
  <build>
    ${objects.map((_, idx) => `<item objectid="${idx + 1}"/>`).join('\n    ')}
  </build>
</model>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const blockHeight = settings.height;
    
    const zip = new JSZip();
    const scadLines: string[] = [];
    
    scadLines.push(`// Generated by firaga.io`);
    scadLines.push(`// Image dimensions: ${width}x${height}`);
    scadLines.push(`pitch = ${pitch};`);
    scadLines.push(`block_height = ${blockHeight};`);
    scadLines.push(``);
    
    // Generate one PNG mask per color
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = '#000000';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `mask_${partIdx}_${colorName}.png`;
        zip.file(filename, pngBlob);
        
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadLines.push(`// ${part.target.name} (${part.count} pixels)`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  surface(file = "${filename}", center = true, invert = true);`);
        scadLines.push(``);
    }
    
    scadLines.push(`// Scale and position the combined image`);
    scadLines.push(`scale([pitch, pitch, block_height])`);
    scadLines.push(`  translate([-${width}/2, -${height}/2, 0])`);
    scadLines.push(`  union() {`);
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `mask_${partIdx}_${colorName}.png`;
        scadLines.push(`    surface(file = "${filename}", center = false);`);
    }
    scadLines.push(`  }`);
    
    const scadContent = scadLines.join('\n');
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}.zip`);
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    if (document.getElementById(tagName)) {
        return;
    }
    
    return new Promise((resolve, reject) => {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => resolve();
        tag.onerror = reject;
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    });
}
