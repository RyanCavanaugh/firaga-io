import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    baseHeight: number;
}

/**
 * Generates a 3MF file containing a triangle mesh with separate material shapes for each color
 */
export function generate3MF(image: PartListImage, settings: ThreeDSettings): Blob {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;

    // Build 3MF XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    xml += '    <basematerials id="1">\n';

    // Define materials for each color
    partList.forEach((part, index) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove '#'
        xml += `      <base name="${escapeXml(color.name)}" displaycolor="#${hexColor}" />\n`;
    });

    xml += '    </basematerials>\n';

    // Generate mesh objects for each color
    partList.forEach((part, materialIndex) => {
        const meshId = materialIndex + 2; // Start from 2 (1 is basematerials)
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Collect all pixels of this color
        const pixelsForColor: Array<{ x: number; y: number }> = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === materialIndex) {
                    pixelsForColor.push({ x, y });
                }
            }
        }

        if (pixelsForColor.length === 0) return;

        // Generate vertices and triangles for each pixel
        pixelsForColor.forEach(({ x, y }) => {
            const baseIdx = vertices.length;
            const x0 = x;
            const x1 = x + 1;
            const y0 = y;
            const y1 = y + 1;
            const z0 = baseHeight;
            const z1 = baseHeight + pixelHeight;

            // Bottom face vertices
            vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
            // Top face vertices
            vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);

            // Bottom face (2 triangles)
            triangles.push([baseIdx, baseIdx + 2, baseIdx + 1]);
            triangles.push([baseIdx, baseIdx + 3, baseIdx + 2]);

            // Top face (2 triangles)
            triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
            triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);

            // Side faces (4 sides, 2 triangles each)
            // Front
            triangles.push([baseIdx, baseIdx + 1, baseIdx + 5]);
            triangles.push([baseIdx, baseIdx + 5, baseIdx + 4]);
            // Right
            triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
            triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
            // Back
            triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
            triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
            // Left
            triangles.push([baseIdx + 3, baseIdx, baseIdx + 4]);
            triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
        });

        xml += `    <object id="${meshId}" type="model">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';
        vertices.forEach(([x, y, z]) => {
            xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
        });
        xml += '        </vertices>\n';
        xml += '        <triangles>\n';
        triangles.forEach(([v1, v2, v3]) => {
            xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${materialIndex}" />\n`;
        });
        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += '    </object>\n';
    });

    xml += '  </resources>\n';
    xml += '  <build>\n';

    // Add all objects to the build
    partList.forEach((_, index) => {
        const meshId = index + 2;
        xml += `    <item objectid="${meshId}" />\n`;
    });

    xml += '  </build>\n';
    xml += '</model>\n';

    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

/**
 * Generates a zip file with OpenSCAD masks
 * Contains one B/W image per color and an .scad file that loads them as heightmaps
 */
export async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;

    // We'll need JSZip - check if it's available
    // For now, we'll create the structure and assume JSZip will be loaded
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
        throw new Error("JSZip library not loaded");
    }

    const zip = new JSZip();

    // Generate one PNG per color
    const imagePromises: Array<Promise<void>> = [];

    partList.forEach((part, colorIndex) => {
        // Create a canvas for this color mask
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
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const filename = `color_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
                    zip.file(filename, blob);
                }
                resolve();
            });
        });

        imagePromises.push(promise);
    });

    // Wait for all images to be generated
    await Promise.all(imagePromises);

    // Generate OpenSCAD file
    let scadContent = '// Generated OpenSCAD file for 3D pixel art\n\n';
    scadContent += `// Image dimensions: ${width}x${height}\n`;
    scadContent += `pixel_height = ${pixelHeight};\n`;
    scadContent += `base_height = ${baseHeight};\n\n`;
    scadContent += 'union() {\n';

    partList.forEach((part, colorIndex) => {
        const filename = `color_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        const color = part.target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);

        scadContent += `  // ${part.target.name}\n`;
        scadContent += `  color([${r}, ${g}, ${b}])\n`;
        scadContent += `  translate([0, 0, base_height])\n`;
        scadContent += `  scale([1, 1, pixel_height])\n`;
        scadContent += `  surface(file = "${filename}", center = false, invert = true);\n\n`;
    });

    scadContent += '}\n';

    zip.file('model.scad', scadContent);

    // Generate the zip blob
    return await zip.generateAsync({ type: 'blob' });
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}
