import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import * as FileSaver from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseThickness: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    FileSaver.saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, baseThickness } = settings;
    
    let vertexId = 1;
    const resources: string[] = [];
    const items: string[] = [];
    
    // Create base materials first
    const baseMaterials: string[] = [];
    image.partList.forEach((part, colorIndex) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        baseMaterials.push(`<base name="${escapeXml(color.name)}" displaycolor="#${hexColor}"/>`);
    });
    
    resources.push(`
    <basematerials id="1">
${baseMaterials.map((mat, idx) => '        ' + mat).join('\n')}
    </basematerials>`);
    
    // Create a mesh for each color
    image.partList.forEach((part, colorIndex) => {
        // Collect all pixels of this color
        const pixels: Array<{ x: number; y: number }> = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    pixels.push({ x, y });
                }
            }
        }
        
        if (pixels.length === 0) return;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        
        const objectId = colorIndex + 2; // Start at 2 because basematerials is 1
        const baseVertex = vertexId;
        
        // Create extruded cube for each pixel
        pixels.forEach(({ x, y }) => {
            const x0 = x;
            const x1 = x + 1;
            const y0 = y;
            const y1 = y + 1;
            const z0 = baseThickness;
            const z1 = baseThickness + pixelHeight;
            
            const v = vertexId - baseVertex;
            
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
            triangles.push(`<triangle v1="${v}" v2="${v + 2}" v3="${v + 1}"/>`);
            triangles.push(`<triangle v1="${v}" v2="${v + 3}" v3="${v + 2}"/>`);
            
            // Top face
            triangles.push(`<triangle v1="${v + 4}" v2="${v + 5}" v3="${v + 6}"/>`);
            triangles.push(`<triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 7}"/>`);
            
            // Front face
            triangles.push(`<triangle v1="${v}" v2="${v + 1}" v3="${v + 5}"/>`);
            triangles.push(`<triangle v1="${v}" v2="${v + 5}" v3="${v + 4}"/>`);
            
            // Back face
            triangles.push(`<triangle v1="${v + 3}" v2="${v + 7}" v3="${v + 6}"/>`);
            triangles.push(`<triangle v1="${v + 3}" v2="${v + 6}" v3="${v + 2}"/>`);
            
            // Left face
            triangles.push(`<triangle v1="${v}" v2="${v + 4}" v3="${v + 7}"/>`);
            triangles.push(`<triangle v1="${v}" v2="${v + 7}" v3="${v + 3}"/>`);
            
            // Right face
            triangles.push(`<triangle v1="${v + 1}" v2="${v + 2}" v3="${v + 6}"/>`);
            triangles.push(`<triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 5}"/>`);
            
            vertexId += 8;
        });
        
        resources.push(`
    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
${vertices.join('\n                ')}
            </vertices>
            <triangles>
${triangles.join('\n                ')}
            </triangles>
        </mesh>
    </object>`);
        
        items.push(`<item objectid="${objectId}" pid="1" pindex="${colorIndex}"/>`);
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
    <resources>
${resources.join('\n')}
    </resources>
    <build>
${items.map(item => '        ' + item).join('\n')}
    </build>
</model>`;
    
    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    // Create individual files and let user download them
    // Without JSZip, we'll generate a single OpenSCAD file with embedded data URIs
    const scadContent = await createOpenSCADWithEmbeddedImages(image, settings);
    const blob = new Blob([scadContent], { type: 'text/plain' });
    FileSaver.saveAs(blob, `${settings.filename}.scad`);
    
    // Also save individual mask images
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelIndex = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                const value = isThisColor ? 255 : 0;
                
                imageData.data[pixelIndex] = value;     // R
                imageData.data[pixelIndex + 1] = value; // G
                imageData.data[pixelIndex + 2] = value; // B
                imageData.data[pixelIndex + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const fileName = `${settings.filename}_color_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        
        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    FileSaver.saveAs(blob, fileName);
                }
                resolve();
            }, 'image/png');
        });
    }
}

async function createOpenSCADWithEmbeddedImages(image: PartListImage, settings: ThreeDSettings): Promise<string> {
    const { pixelHeight, baseThickness } = settings;
    
    let scadCode = `// Generated by firaga.io
// Image dimensions: ${image.width}x${image.height}
// Pixel height: ${pixelHeight}mm
// Base thickness: ${baseThickness}mm
//
// Note: This file expects PNG mask images to be in the same directory.
// Download the individual mask images separately.

`;
    
    image.partList.forEach((part, colorIndex) => {
        const fileName = `${settings.filename}_color_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        const hexColor = colorEntryToHex(part.target);
        
        scadCode += `
// ${part.target.name} (${hexColor})
color("${hexColor}")
translate([0, 0, ${baseThickness}])
scale([1, 1, ${pixelHeight}])
surface(file = "${fileName}", center = true, invert = true);
`;
    });
    
    // Add a base plate
    scadCode += `
// Base plate
color("#808080")
translate([${image.width / 2}, ${image.height / 2}, ${baseThickness / 2}])
cube([${image.width}, ${image.height}, ${baseThickness}], center = true);
`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
