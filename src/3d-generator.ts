import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    heightPerLayer: number;
    baseHeight: number;
};

/**
 * Generate 3D output in the specified format
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate 3MF file with separate material shapes per color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const { width, height, partList, pixels } = image;
    const { heightPerLayer, baseHeight } = settings;

    // Build materials section
    const materials: string[] = [];
    partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target).substring(1); // Remove #
        materials.push(`    <m:color name="${escapeXml(entry.target.name)}" color="#${hex}FF" />`);
    });

    const materialsXml = materials.join('\n');

    // Build mesh vertices and triangles for each color layer
    const meshObjects: string[] = [];
    
    partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexOffset = 0;

        // Generate geometry for each pixel of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a rectangular prism for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseHeight;
                    const z1 = baseHeight + heightPerLayer;

                    // 8 vertices of the box
                    vertices.push(
                        `        <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `        <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `        <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `        <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `        <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `        <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `        <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `        <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );

                    // 12 triangles (2 per face, 6 faces)
                    const v = vertexOffset;
                    // Bottom face
                    triangles.push(
                        `        <triangle v1="${v + 0}" v2="${v + 1}" v3="${v + 2}" />`,
                        `        <triangle v1="${v + 0}" v2="${v + 2}" v3="${v + 3}" />`
                    );
                    // Top face
                    triangles.push(
                        `        <triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 5}" />`,
                        `        <triangle v1="${v + 4}" v2="${v + 7}" v3="${v + 6}" />`
                    );
                    // Front face
                    triangles.push(
                        `        <triangle v1="${v + 0}" v2="${v + 4}" v3="${v + 5}" />`,
                        `        <triangle v1="${v + 0}" v2="${v + 5}" v3="${v + 1}" />`
                    );
                    // Back face
                    triangles.push(
                        `        <triangle v1="${v + 2}" v2="${v + 6}" v3="${v + 7}" />`,
                        `        <triangle v1="${v + 2}" v2="${v + 7}" v3="${v + 3}" />`
                    );
                    // Left face
                    triangles.push(
                        `        <triangle v1="${v + 0}" v2="${v + 3}" v3="${v + 7}" />`,
                        `        <triangle v1="${v + 0}" v2="${v + 7}" v3="${v + 4}" />`
                    );
                    // Right face
                    triangles.push(
                        `        <triangle v1="${v + 1}" v2="${v + 5}" v3="${v + 6}" />`,
                        `        <triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 2}" />`
                    );

                    vertexOffset += 8;
                }
            }
        }

        if (vertices.length > 0) {
            meshObjects.push(`
    <object id="${colorIdx + 2}" type="model" pid="1" pindex="${colorIdx}">
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

    const objectsXml = meshObjects.join('\n');

    // Build components section (references to all colored objects)
    const components = meshObjects.map((_, idx) => 
        `      <component objectid="${idx + 2}" />`
    ).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">Firaga 3D Export</metadata>
  <metadata name="Designer">firaga.io</metadata>
  
  <resources>
    <basematerials id="1">
${materialsXml}
    </basematerials>

    <object id="1" type="model">
      <components>
${components}
      </components>
    </object>
${objectsXml}
  </resources>

  <build>
    <item objectid="1" />
  </build>
</model>`;

    downloadFile(xml, "firaga-export.3mf", "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

/**
 * Generate zip file with OpenSCAD masks
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { heightPerLayer, baseHeight } = settings;

    // Load JSZip dynamically
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const scadLines: string[] = [];
    scadLines.push('// Generated by firaga.io');
    scadLines.push('');

    // Generate one PNG per color
    const blobPromises: Promise<void>[] = [];
    
    partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return;
        }

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

        // Convert canvas to blob and add to zip
        const filename = `color_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        
        const blobPromise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(filename, blob);
                }
                resolve();
            }, 'image/png');
        });
        
        blobPromises.push(blobPromise);

        // Add OpenSCAD code for this layer
        const hex = colorEntryToHex(entry.target);
        scadLines.push(`// ${entry.target.name} (${hex})`);
        scadLines.push(`color("${hex}") translate([0, 0, ${baseHeight + colorIdx * heightPerLayer}])`);
        scadLines.push(`  surface(file = "${filename}", center = true, invert = true);`);
        scadLines.push('');
    });

    // Wait for all blobs to be created
    await Promise.all(blobPromises);

    // Add the OpenSCAD file
    const scadContent = scadLines.join('\n');
    zip.file('firaga-export.scad', scadContent);

    // Generate and download the zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firaga-export-openscad.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Load JSZip library dynamically
 */
async function loadJSZip(): Promise<typeof import('jszip')> {
    return new Promise((resolve, reject) => {
        const tagName = 'jszip-script-tag';
        const scriptEl = document.getElementById(tagName);
        
        if (scriptEl) {
            resolve((window as any).JSZip);
            return;
        }

        const tag = document.createElement('script');
        tag.id = tagName;
        tag.onload = () => {
            resolve((window as any).JSZip);
        };
        tag.onerror = reject;
        tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(tag);
    });
}

/**
 * Download a file to the user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
