import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
};

/**
 * Generates 3D output files from a PartListImage
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings, filename);
    } else {
        await generateOpenSCADMasks(image, settings, filename);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;

    // Build material definitions
    const materials: string[] = [];
    partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        materials.push(`    <basematerials:base name="${escapeXml(entry.target.name)}" displaycolor="#${hex.slice(1)}" />`);
    });

    // Build mesh components for each color
    const meshObjects: string[] = [];
    partList.forEach((entry, materialIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === materialIdx) {
                    // Create a box for this pixel
                    const baseIdx = vertices.length;
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;

                    // 8 vertices of the box
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face
                    triangles.push([baseIdx + 3, baseIdx + 7, baseIdx + 6]);
                    triangles.push([baseIdx + 3, baseIdx + 6, baseIdx + 2]);
                    // Left face
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 3]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length === 0) return;

        const meshId = materialIdx + 2;
        let meshXml = `  <object id="${meshId}" type="model">\n`;
        meshXml += `    <mesh>\n`;
        meshXml += `      <vertices>\n`;
        vertices.forEach(([x, y, z]) => {
            meshXml += `        <vertex x="${x}" y="${y}" z="${z}" />\n`;
        });
        meshXml += `      </vertices>\n`;
        meshXml += `      <triangles>\n`;
        triangles.forEach(([v1, v2, v3]) => {
            meshXml += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${materialIdx}" />\n`;
        });
        meshXml += `      </triangles>\n`;
        meshXml += `    </mesh>\n`;
        meshXml += `  </object>\n`;
        
        meshObjects.push(meshXml);
    });

    // Build the complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${meshObjects.join('')}
  </resources>
  <build>
    <item objectid="2" />
  </build>
</model>`;

    // Download the file
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadBlob(blob, `${filename}.3mf`);
}

/**
 * Generate OpenSCAD masks format (zip with images and .scad file)
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelHeight } = settings;

    // We need JSZip for creating the zip file
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Create one monochrome image per color
    const scadLayers: string[] = [];
    
    partList.forEach((entry, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const isColor = pixels[y][x] === idx;
                const value = isColor ? 255 : 0;
                imageData.data[offset] = value;
                imageData.data[offset + 1] = value;
                imageData.data[offset + 2] = value;
                imageData.data[offset + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to PNG blob
        const pngFilename = `mask_${idx}_${sanitizeFilename(entry.target.name)}.png`;
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1];
        zip.file(pngFilename, base64Data, { base64: true });
        
        // Add OpenSCAD layer
        const hex = colorEntryToHex(entry.target).slice(1);
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        
        scadLayers.push(`
// ${entry.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${idx * pixelHeight}])
surface(file = "${pngFilename}", convexity = 5, center = true)
scale([1, 1, ${pixelHeight / 255}]);
`);
    });

    // Create the OpenSCAD file
    const scadContent = `// Generated by firaga.io
// Image: ${filename}
// Dimensions: ${width}x${height}

${scadLayers.join('\n')}
`;

    zip.file(`${filename}.scad`, scadContent);

    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

/**
 * Load JSZip library dynamically
 */
async function loadJSZip(): Promise<typeof import('jszip')> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
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

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

/**
 * Sanitize filename for use in filesystem
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
