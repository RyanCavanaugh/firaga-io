import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type ThreeDExportFormat = "3mf" | "openscad-masks";

export interface ThreeDExportSettings {
    format: ThreeDExportFormat;
    filename: string;
    pixelWidth: number; // Width in mm of each pixel
    pixelHeight: number; // Height in mm of the 3D extrusion
}

export async function export3D(image: PartListImage, settings: ThreeDExportSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDExportSettings) {
    const xml = generate3MF(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MF(image: PartListImage, settings: ThreeDExportSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelWidth, pixelHeight } = settings;
    
    // Build meshes for each color
    let objectId = 1;
    const objects: string[] = [];
    const buildItems: string[] = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate vertices and triangles for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    const baseIdx = vertexCount;
                    
                    // 8 vertices of the cube
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
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+3}" v3="${baseIdx+7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx+3}" v2="${baseIdx+0}" v3="${baseIdx+4}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+3}" v2="${baseIdx+4}" v3="${baseIdx+7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}"/>`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = rgbToHex(part.target.r, part.target.g, part.target.b);
            objects.push(`
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>
    <basematerials id="${objectId + 1000}">
      <base name="${part.target.name}" displaycolor="${colorHex}" />
    </basematerials>`);
            
            buildItems.push(`    <item objectid="${objectId}" partnumber="${part.target.code || part.target.name}" />`);
            objectId++;
        }
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
    
    return xml;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function exportOpenSCADMasks(image: PartListImage, settings: ThreeDExportSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { width, height, pixels, partList } = image;
    const { pixelWidth, pixelHeight } = settings;
    
    // Create one monochrome image per color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDExportSettings): string {
    const { width, height, partList } = image;
    const { pixelWidth, pixelHeight } = settings;
    
    const parts: string[] = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const filename = `mask_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        parts.push(`
// ${part.target.name} (${part.count} pixels)
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([${pixelWidth}, ${pixelWidth}, ${pixelHeight}])
    surface(file = "${filename}", center = false, invert = true);
`);
    }
    
    const scad = `// Generated by firaga.io
// Image: ${width} x ${height} pixels
// Pixel size: ${pixelWidth} mm
// Extrusion height: ${pixelHeight} mm

${parts.join('\n')}
`;
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function loadJSZip(): Promise<any> {
    // Load JSZip from CDN if not already loaded
    if (!(window as any).JSZip) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
    }
    return (window as any).JSZip;
}
