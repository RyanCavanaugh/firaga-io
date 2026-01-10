import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad';

export function generate3D(image: PartListImage, format: ThreeDFormat, filename: string) {
    if (format === '3mf') {
        generate3MF(image, filename);
    } else {
        generateOpenSCAD(image, filename);
    }
}

function generate3MF(image: PartListImage, filename: string) {
    // Generate 3MF file with triangle mesh
    const pixelHeight = 1.0;
    const pixelWidth = 1.0;
    const baseHeight = 0.5;
    
    // Build vertices and triangles for each color
    const materials: string[] = [];
    const materialObjects: string[] = [];
    
    image.partList.forEach((part, materialIndex) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove # prefix
        const materialId = materialIndex + 1;
        
        // Add material definition
        materials.push(`    <base:material name="${escapeXml(part.target.name)}" displaycolor="#${color}" />`);
        
        // Build mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = baseHeight;
                    
                    // 8 vertices of the box
                    const startVertex = vertexIndex;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    vertexIndex += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${startVertex + 0}" v2="${startVertex + 2}" v3="${startVertex + 1}" />`);
                    triangles.push(`      <triangle v1="${startVertex + 0}" v2="${startVertex + 3}" v3="${startVertex + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${startVertex + 4}" v2="${startVertex + 5}" v3="${startVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${startVertex + 4}" v2="${startVertex + 6}" v3="${startVertex + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${startVertex + 0}" v2="${startVertex + 1}" v3="${startVertex + 5}" />`);
                    triangles.push(`      <triangle v1="${startVertex + 0}" v2="${startVertex + 5}" v3="${startVertex + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${startVertex + 2}" v2="${startVertex + 3}" v3="${startVertex + 7}" />`);
                    triangles.push(`      <triangle v1="${startVertex + 2}" v2="${startVertex + 7}" v3="${startVertex + 6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${startVertex + 3}" v2="${startVertex + 0}" v3="${startVertex + 4}" />`);
                    triangles.push(`      <triangle v1="${startVertex + 3}" v2="${startVertex + 4}" v3="${startVertex + 7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${startVertex + 1}" v2="${startVertex + 2}" v3="${startVertex + 6}" />`);
                    triangles.push(`      <triangle v1="${startVertex + 1}" v2="${startVertex + 6}" v3="${startVertex + 5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            materialObjects.push(`  <object id="${materialId}" name="${escapeXml(part.target.name)}" type="model" pid="1" pindex="${materialIndex}">
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
    
    const buildItems = image.partList.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n');
    
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${materialObjects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
    
    // For simplicity, we're creating a basic 3MF which is just a zip with the model file
    // In a full implementation, you'd use a zip library like JSZip
    // For now, we'll just save the XML with a note that it needs to be zipped
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.model`);
    
    alert('Note: The .model file has been saved. To create a valid 3MF file, you need to:\n1. Create a folder called "3D"\n2. Place this file as "3D/3dmodel.model"\n3. Create a [Content_Types].xml file\n4. Zip these files with .3mf extension\n\nOr use a proper 3MF library for complete support.');
}

function generateOpenSCAD(image: PartListImage, filename: string) {
    // Generate OpenSCAD masks format
    const canvases: { name: string, canvas: HTMLCanvasElement, color: string }[] = [];
    
    // Create a black/white mask for each color
    image.partList.forEach((part, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === index) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        canvases.push({
            name: sanitizeFilename(part.target.name) || `color_${index}`,
            canvas: canvas,
            color: colorEntryToHex(part.target)
        });
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated 3D mosaic from ${filename}
// Image size: ${image.width}x${image.height}

pixel_width = 1.0;
pixel_height = 0.5;

`;
    
    // Add modules for each color
    canvases.forEach(({ name, color }) => {
        scadContent += `module layer_${name}() {
    color("${color}")
    scale([pixel_width, pixel_width, pixel_height])
    surface(file = "${name}.png", center = true, invert = true);
}

`;
    });
    
    // Add union of all layers
    scadContent += `union() {\n`;
    canvases.forEach(({ name }) => {
        scadContent += `    layer_${name}();\n`;
    });
    scadContent += `}\n`;
    
    // Create files object for download
    // Since we can't create a real zip in the browser without a library,
    // we'll download files separately
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    saveAs(scadBlob, `${filename}.scad`);
    
    // Download each PNG mask
    canvases.forEach(({ name, canvas }) => {
        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${name}.png`);
            }
        });
    });
    
    alert(`OpenSCAD files generated!\n\nDownloaded:\n- ${filename}.scad\n- ${canvases.length} PNG mask files\n\nPlace all files in the same directory and open the .scad file in OpenSCAD.`);
}

function escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
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

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}
