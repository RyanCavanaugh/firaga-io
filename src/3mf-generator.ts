import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number;
    pixelWidth: number;
    baseHeight: number;
}

export async function export3D(image: PartListImage, settings: ThreeDSettings, filename: string) {
    if (settings.format === "3mf") {
        export3MF(image, settings, filename);
    } else {
        exportOpenSCAD(image, settings, filename);
    }
}

function export3MF(image: PartListImage, settings: ThreeDSettings, filename: string) {
    // 3MF is an XML-based format
    const meshes: string[] = [];
    const resources: string[] = [];
    let objectId = 1;
    let resourceId = 1;

    // Create a mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        const color = colorEntryToHex(part.target);
        const rgbMatch = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
        const r = rgbMatch ? parseInt(rgbMatch[1], 16) : 128;
        const g = rgbMatch ? parseInt(rgbMatch[2], 16) : 128;
        const b = rgbMatch ? parseInt(rgbMatch[3], 16) : 128;

        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * settings.pixelWidth;
                    const x1 = (x + 1) * settings.pixelWidth;
                    const y0 = y * settings.pixelWidth;
                    const y1 = (y + 1) * settings.pixelWidth;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.pixelHeight;

                    const baseIdx = vertexIndex;
                    
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
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+2}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+3}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+7}" v3="${baseIdx+6}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+4}" v3="${baseIdx+5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+1}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+6}" v3="${baseIdx+7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+3}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+7}" v3="${baseIdx+4}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+5}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+2}"/>`);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            // Create color resource
            resources.push(`<basematerials id="${resourceId}">
  <base name="${part.target.name}" displaycolor="#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}" />
</basematerials>`);

            // Create mesh object
            meshes.push(`<object id="${objectId}" type="model" pid="${resourceId}" pindex="0">
  <mesh>
    <vertices>
      ${vertices.join('\n      ')}
    </vertices>
    <triangles>
      ${triangles.join('\n      ')}
    </triangles>
  </mesh>
</object>`);

            objectId++;
            resourceId++;
        }
    });

    // Build items list (references to all objects)
    const items = meshes.map((_, idx) => `<item objectid="${idx + 1}"/>`).join('\n    ');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${resources.join('\n    ')}
    ${meshes.join('\n    ')}
  </resources>
  <build>
    ${items}
  </build>
</model>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, filename.replace(/\.[^.]+$/, "") + ".3mf");
}

function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string) {
    // We need to create a zip file containing:
    // 1. One PNG image per color (black and white mask)
    // 2. An OpenSCAD file that loads them
    
    // For now, we'll create a simpler output: just the .scad file and save masks separately
    // In a production app, you'd use JSZip library
    
    const scadLines: string[] = [];
    scadLines.push('// Generated by firaga.io');
    scadLines.push(`// Image: ${filename}`);
    scadLines.push('');
    
    // Create the main module
    scadLines.push('module pixel_art() {');
    
    image.partList.forEach((part, colorIndex) => {
        scadLines.push(`  // Color: ${part.target.name}`);
        scadLines.push(`  color("${colorEntryToHex(part.target)}") {`);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    scadLines.push(`    translate([${x * settings.pixelWidth}, ${y * settings.pixelWidth}, ${settings.baseHeight}])`);
                    scadLines.push(`      cube([${settings.pixelWidth}, ${settings.pixelWidth}, ${settings.pixelHeight}]);`);
                }
            }
        }
        
        scadLines.push('  }');
    });
    
    scadLines.push('}');
    scadLines.push('');
    scadLines.push('pixel_art();');

    const scadContent = scadLines.join('\n');
    const blob = new Blob([scadContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename.replace(/\.[^.]+$/, "") + ".scad");
    
    // Note: In a full implementation, we would also generate PNG masks for each color
    // and bundle everything in a ZIP file using a library like JSZip
    alert('OpenSCAD file saved! Note: PNG masks not yet implemented. Use the 3MF format for a complete export.');
}
