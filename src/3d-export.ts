import { saveAs } from 'file-saver';
import { PartListImage, PartListEntry } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3dFormat = '3mf' | 'openscad-masks';

export interface Export3dSettings {
    format: Export3dFormat;
    heightPerLayer: number; // in mm
    baseThickness: number; // in mm
    pixelSize: number; // in mm
}

/**
 * Export the image as a 3D model
 */
export function export3d(image: PartListImage, settings: Export3dSettings, filename: string): void {
    if (settings.format === '3mf') {
        export3mf(image, settings, filename);
    } else {
        exportOpenScadMasks(image, settings, filename);
    }
}

/**
 * Export as 3MF triangle mesh with separate material shapes for each color
 */
function export3mf(image: PartListImage, settings: Export3dSettings, filename: string): void {
    const xml = generate3mfXml(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Generate 3MF XML content
 */
function generate3mfXml(image: PartListImage, settings: Export3dSettings): string {
    const { width, height, partList } = image;
    const { heightPerLayer, baseThickness, pixelSize } = settings;

    let vertexId = 1;
    let triangleId = 1;
    const objects: string[] = [];
    const resources: string[] = [];

    // Generate a mesh for each color
    partList.forEach((part, colorIndex) => {
        const positions: Array<{ x: number; y: number; z: number }> = [];
        
        // Collect all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    positions.push({ x, y, z: 0 });
                }
            }
        }

        if (positions.length === 0) return;

        const vertices: string[] = [];
        const triangles: string[] = [];
        const startVertexId = vertexId;

        // Create a cube for each pixel of this color
        positions.forEach(pos => {
            const x0 = pos.x * pixelSize;
            const x1 = (pos.x + 1) * pixelSize;
            const y0 = pos.y * pixelSize;
            const y1 = (pos.y + 1) * pixelSize;
            const z0 = baseThickness;
            const z1 = baseThickness + heightPerLayer;

            // 8 vertices of a cube
            const v0 = vertexId++;
            const v1 = vertexId++;
            const v2 = vertexId++;
            const v3 = vertexId++;
            const v4 = vertexId++;
            const v5 = vertexId++;
            const v6 = vertexId++;
            const v7 = vertexId++;

            vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
            vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
            vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
            vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
            vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
            vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
            vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
            vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);

            // 12 triangles (2 per face, 6 faces)
            // Bottom face
            triangles.push(`<triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
            triangles.push(`<triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
            // Top face
            triangles.push(`<triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
            triangles.push(`<triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
            // Front face
            triangles.push(`<triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
            triangles.push(`<triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
            // Back face
            triangles.push(`<triangle v1="${v3}" v2="${v7}" v3="${v6}" />`);
            triangles.push(`<triangle v1="${v3}" v2="${v6}" v3="${v2}" />`);
            // Left face
            triangles.push(`<triangle v1="${v0}" v2="${v4}" v3="${v7}" />`);
            triangles.push(`<triangle v1="${v0}" v2="${v7}" v3="${v3}" />`);
            // Right face
            triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
            triangles.push(`<triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
        });

        const hex = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        resources.push(`<basematerials id="${colorIndex + 2}">
            <base name="${part.target.name}" displaycolor="#${hex}" />
        </basematerials>`);

        objects.push(`<object id="${colorIndex + 2}" type="model" pid="${colorIndex + 2}" pindex="0">
            <mesh>
                <vertices>
                    ${vertices.join('\n                    ')}
                </vertices>
                <triangles>
                    ${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        ${resources.join('\n        ')}
        ${objects.join('\n        ')}
        <object id="1" type="model">
            <components>
                ${partList.map((_, idx) => `<component objectid="${idx + 2}" />`).join('\n                ')}
            </components>
        </object>
    </resources>
    <build>
        <item objectid="1" />
    </build>
</model>`;

    return xml;
}

/**
 * Export as OpenSCAD masks - a zip file with monochrome images and a .scad file
 */
async function exportOpenScadMasks(image: PartListImage, settings: Export3dSettings, filename: string): Promise<void> {
    // We need JSZip for creating the zip file
    // For now, we'll create a simple implementation that creates separate files
    // In a production environment, you'd want to use JSZip library
    
    const scadContent = generateOpenScadFile(image, settings);
    const masks = generateColorMasks(image);

    // Create a simple zip-like structure by downloading files separately
    // In a real implementation, use JSZip
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    saveAs(scadBlob, `${filename}.scad`);

    // Save each mask
    masks.forEach((maskDataUrl, index) => {
        const part = image.partList[index];
        fetch(maskDataUrl)
            .then(res => res.blob())
            .then(blob => {
                saveAs(blob, `${filename}_${sanitizeFilename(part.target.name)}.png`);
            });
    });

    alert(`Exported ${masks.length + 1} files for OpenSCAD. Load ${filename}.scad in OpenSCAD to view the 3D model.`);
}

/**
 * Generate OpenSCAD file content
 */
function generateOpenScadFile(image: PartListImage, settings: Export3dSettings): string {
    const { width, height, partList } = image;
    const { heightPerLayer, baseThickness, pixelSize } = settings;

    const parts = partList.map((part, index) => {
        const sanitizedName = sanitizeFilename(part.target.name);
        const hex = colorEntryToHex(part.target).substring(1);
        
        return `// ${part.target.name} (${part.count} pixels)
translate([0, 0, ${baseThickness}])
    color("#${hex}")
    scale([${pixelSize}, ${pixelSize}, ${heightPerLayer}])
    surface(file = "${sanitizedName}.png", center = true, invert = true);`;
    });

    return `// Generated by firaga.io - 3D bead art
// Image: ${width}x${height} pixels
// Colors: ${partList.length}

$fn = 32; // Circle resolution

// Base layer
color("gray")
    cube([${width * pixelSize}, ${height * pixelSize}, ${baseThickness}], center = true);

// Color layers
${parts.join('\n\n')}
`;
}

/**
 * Generate black/white mask images for each color
 */
function generateColorMasks(image: PartListImage): string[] {
    const { width, height, partList } = image;
    const masks: string[] = [];

    partList.forEach((_, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                const value = isThisColor ? 255 : 0;
                
                imageData.data[idx] = value;     // R
                imageData.data[idx + 1] = value; // G
                imageData.data[idx + 2] = value; // B
                imageData.data[idx + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        masks.push(canvas.toDataURL('image/png'));
    });

    return masks;
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
