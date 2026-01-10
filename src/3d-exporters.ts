import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DSettings = {
    pixelHeight: number;
    baseThickness: number;
    filename: string;
};

export async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const { pixelHeight, baseThickness, filename } = settings;
    
    // 3MF is a ZIP-based format
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file('[Content_Types].xml', generate3MFContentTypes());
    zip.file('_rels/.rels', generate3MFRels());
    
    // Generate 3D model
    const model3D = generate3MFModel(image, pixelHeight, baseThickness);
    zip.file('3D/3dmodel.model', model3D);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}.3mf`);
}

export async function exportOpenScadMasks(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const { pixelHeight, baseThickness, filename } = settings;
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const maskData = generateMaskImage(image, colorIdx);
        zip.file(`mask_${colorIdx}.png`, maskData);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenScadFile(image, pixelHeight, baseThickness);
    zip.file(`${filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}_openscad.zip`);
}

function generate3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generate3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3MFModel(image: PartListImage, pixelHeight: number, baseThickness: number): string {
    const meshes: string[] = [];
    let objectId = 1;
    
    // Generate mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Generate extruded boxes for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box from (x, y, 0) to (x+1, y+1, height)
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = baseThickness;
                    const z1 = baseThickness + pixelHeight;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexIndex;
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}"/>`
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}"/>`,
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}"/>`
                    );
                    // Top face
                    triangles.push(
                        `<triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}"/>`,
                        `<triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}"/>`
                    );
                    // Front face
                    triangles.push(
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}"/>`,
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}"/>`
                    );
                    // Back face
                    triangles.push(
                        `<triangle v1="${baseIdx+2}" v2="${baseIdx+3}" v3="${baseIdx+7}"/>`,
                        `<triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+6}"/>`
                    );
                    // Left face
                    triangles.push(
                        `<triangle v1="${baseIdx+3}" v2="${baseIdx+0}" v3="${baseIdx+4}"/>`,
                        `<triangle v1="${baseIdx+3}" v2="${baseIdx+4}" v3="${baseIdx+7}"/>`
                    );
                    // Right face
                    triangles.push(
                        `<triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}"/>`,
                        `<triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}"/>`
                    );
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const mesh = `
    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
${vertices.join('\n                ')}
            </vertices>
            <triangles>
${triangles.join('\n                ')}
            </triangles>
        </mesh>
    </object>`;
            meshes.push(mesh);
            objectId++;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
${meshes.join('\n')}
    </resources>
    <build>
${meshes.map((_, idx) => `        <item objectid="${idx + 1}"/>`).join('\n')}
    </build>
</model>`;
}

function generateMaskImage(image: PartListImage, colorIdx: number): Uint8Array {
    // Create a grayscale PNG where white = this color, black = not this color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixelColorIdx = image.pixels[y][x];
            const isThisColor = pixelColorIdx === colorIdx;
            const value = isThisColor ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to PNG blob
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
}

function generateOpenScadFile(image: PartListImage, pixelHeight: number, baseThickness: number): string {
    const parts: string[] = [];
    
    parts.push(`// Generated by firaga.io`);
    parts.push(`// Image: ${image.width}x${image.height} pixels`);
    parts.push(`// Colors: ${image.partList.length}`);
    parts.push(``);
    parts.push(`pixel_height = ${pixelHeight};`);
    parts.push(`base_thickness = ${baseThickness};`);
    parts.push(`image_width = ${image.width};`);
    parts.push(`image_height = ${image.height};`);
    parts.push(``);
    
    // Generate modules for each color layer
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx].target;
        const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        
        parts.push(`// ${color.name} (${color.code ?? 'no code'})`);
        parts.push(`module layer_${colorIdx}_${colorName}() {`);
        parts.push(`    color([${(color.r/255).toFixed(3)}, ${(color.g/255).toFixed(3)}, ${(color.b/255).toFixed(3)}])`);
        parts.push(`    translate([0, 0, base_thickness])`);
        parts.push(`    linear_extrude(height = pixel_height)`);
        parts.push(`    scale([1, 1])`);
        parts.push(`    resize([image_width, image_height, 0])`);
        parts.push(`    surface(file = "mask_${colorIdx}.png", center = false, invert = true);`);
        parts.push(`}`);
        parts.push(``);
    }
    
    // Add base plate if baseThickness > 0
    if (baseThickness > 0) {
        parts.push(`// Base plate`);
        parts.push(`module base_plate() {`);
        parts.push(`    color([0.5, 0.5, 0.5])`);
        parts.push(`    cube([image_width, image_height, base_thickness]);`);
        parts.push(`}`);
        parts.push(``);
    }
    
    // Combine all layers
    parts.push(`// Combine all layers`);
    parts.push(`union() {`);
    if (baseThickness > 0) {
        parts.push(`    base_plate();`);
    }
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorName = image.partList[colorIdx].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        parts.push(`    layer_${colorIdx}_${colorName}();`);
    }
    parts.push(`}`);
    
    return parts.join('\n');
}
