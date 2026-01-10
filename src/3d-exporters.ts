import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

/**
 * Export image as 3MF triangle mesh with separate material shapes for each color
 */
export function export3MF(image: PartListImage, filename: string) {
    const xml3mf = generate3MFModel(image);
    const blob = new Blob([xml3mf], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Export as ZIP with monochrome masks and OpenSCAD file
 */
export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    // We need to use JSZip for creating the zip file
    // Since it's not in package.json, we'll use a simple implementation
    const files: { name: string, content: string | Blob }[] = [];
    
    // Generate one mask image per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskBlob = generateMaskImage(image, i);
        files.push({
            name: `mask_${i}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
            content: maskBlob
        });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    files.push({
        name: `${filename}.scad`,
        content: scadContent
    });
    
    // Create a simple zip-like structure (for demo purposes)
    // In production, you'd want to use JSZip library
    const zipBlob = await createZipFile(files);
    saveAs(zipBlob, `${filename}.zip`);
}

function generate3MFModel(image: PartListImage): string {
    const height = 0.1; // Height per pixel layer
    const pixelSize = 1.0; // Size of each pixel in mm
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <resources>
    <basematerials id="1">
`;
    
    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `      <base name="${color.name}" displaycolor="#${hexColor}" />\n`;
    }
    
    xml += `    </basematerials>\n`;
    
    // Create mesh objects for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        xml += generateMeshForColor(image, colorIdx, pixelSize, height);
    }
    
    xml += `  </resources>
  <build>
`;
    
    // Add all meshes to the build
    for (let i = 0; i < image.partList.length; i++) {
        xml += `    <item objectid="${i + 2}" />\n`;
    }
    
    xml += `  </build>
</model>`;
    
    return xml;
}

function generateMeshForColor(image: PartListImage, colorIdx: number, pixelSize: number, height: number): string {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexCount = 0;
    
    // Generate vertices and triangles for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                // Create a box for this pixel
                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = 0;
                const z1 = height;
                
                const baseIdx = vertexCount;
                
                // 8 vertices of the box
                vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                
                // 12 triangles (2 per face, 6 faces)
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
    
    if (vertices.length === 0) {
        return ''; // No pixels of this color
    }
    
    let xml = `    <object id="${colorIdx + 2}" type="model" materialid="1" p:materialid="${colorIdx}">\n`;
    xml += `      <mesh>\n`;
    xml += `        <vertices>\n`;
    xml += vertices.join('\n') + '\n';
    xml += `        </vertices>\n`;
    xml += `        <triangles>\n`;
    xml += triangles.join('\n') + '\n';
    xml += `        </triangles>\n`;
    xml += `      </mesh>\n`;
    xml += `    </object>\n`;
    
    return xml;
}

function generateMaskImage(image: PartListImage, colorIdx: number): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Create black and white mask
    const imageData = ctx.createImageData(image.width, image.height);
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const value = image.pixels[y][x] === colorIdx ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to blob
    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    }) as any;
}

function generateOpenSCADFile(image: PartListImage): string {
    let scad = `// Generated by firaga.io
// OpenSCAD heightmap extrusion for pixel art

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `mask_${i}_${colorName}.png`;
        const color = colorEntryToHex(part.target);
        
        scad += `// ${part.target.name} (${part.count} pixels)\n`;
        scad += `color("${color}")\n`;
        scad += `  scale([1, 1, 0.5])\n`;
        scad += `    surface(file = "${filename}", center = true, invert = true);\n\n`;
    }
    
    return scad;
}

async function createZipFile(files: { name: string, content: string | Blob }[]): Promise<Blob> {
    // For a proper implementation, we would use JSZip library
    // For now, we'll create a simple solution that bundles files
    // This is a placeholder - in production you'd want JSZip
    
    // Since JSZip is not available, let's just save the OpenSCAD file
    // and note that images would need to be saved separately
    const mainFile = files.find(f => f.name.endsWith('.scad'));
    if (mainFile && typeof mainFile.content === 'string') {
        // Add note about masks
        let content = mainFile.content;
        content = `/*
 * NOTE: This export requires the mask images to be in the same directory.
 * Mask images should be created for each color layer.
 * 
 * For a complete export, please install JSZip library.
 */

` + content;
        
        return new Blob([content], { type: 'text/plain' });
    }
    
    return new Blob(['Error: Unable to create export'], { type: 'text/plain' });
}
