import { PartListImage } from "./image-utils";
import JSZip from "jszip";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    pixelHeight: number;
    baseHeight: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadBlob(blob, "model.3mf");
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const resources: string[] = [];
    const objects: string[] = [];
    
    // Generate materials for each color
    image.partList.forEach((part, index) => {
        const color = part.target;
        const hex = rgbToHex(color.r, color.g, color.b);
        resources.push(`    <basematerials id="${index + 1}">
      <base name="${escapeXml(color.name)}" displaycolor="${hex}" />
    </basematerials>`);
    });

    // Generate mesh objects for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const baseIdx = vertexCount;
                    
                    // Bottom vertices (z = 0)
                    vertices.push(`      <vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="0" />`);
                    
                    // Top vertices (z = height)
                    const h = settings.baseHeight + settings.pixelHeight;
                    vertices.push(`      <vertex x="${x}" y="${y}" z="${h}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y}" z="${h}" />`);
                    vertices.push(`      <vertex x="${x + 1}" y="${y + 1}" z="${h}" />`);
                    vertices.push(`      <vertex x="${x}" y="${y + 1}" z="${h}" />`);
                    
                    // Create triangles for the cube (12 triangles, 2 per face)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    
                    // Top face
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    
                    // Front face
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    
                    // Back face
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    
                    // Left face
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    
                    // Right face
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(`    <object id="${colorIndex + 100}" type="model" pid="${colorIndex + 1}" pindex="0">
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

    // Build components list
    const components = objects.map((_, idx) => 
        `      <component objectid="${idx + 100}" />`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
${objects.join('\n')}
    <object id="1000" type="model">
      <components>
${components}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1000" />
  </build>
</model>`;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create a mask image for each color
    const maskPromises = image.partList.map(async (part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        return new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        }).then(blob => {
            const filename = `mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
            zip.file(filename, blob);
            return { filename, part, colorIndex };
        });
    });
    
    const masks = await Promise.all(maskPromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADContent(masks, image, settings);
    zip.file("model.scad", scadContent);
    
    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, "openscad-masks.zip");
}

function generateOpenSCADContent(
    masks: Array<{ filename: string, part: any, colorIndex: number }>,
    image: PartListImage,
    settings: ThreeDSettings
): string {
    const layers = masks.map(mask => {
        const color = mask.part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        return `// ${mask.part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  translate([0, 0, ${settings.baseHeight}])
    surface(file = "${mask.filename}", center = true, invert = true, convexity = 5)
      scale([1, 1, ${settings.pixelHeight}]);`;
    });
    
    return `// Generated OpenSCAD model
// Image size: ${image.width}x${image.height}
// Base height: ${settings.baseHeight}mm
// Pixel height: ${settings.pixelHeight}mm

union() {
${layers.join('\n\n')}
}`;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
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
