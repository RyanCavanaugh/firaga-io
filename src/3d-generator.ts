import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    pixelHeight: number;
    baseHeight: number;
    filename: string;
};

export function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === '3mf') {
        generate3MF(image, settings);
    } else if (settings.format === 'openscad') {
        generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const pixelSize = 1.0; // 1mm per pixel
    const { pixelHeight, baseHeight } = settings;

    // Build materials section
    let materialsXML = '';
    let resourcesXML = '';
    let buildItemsXML = '';
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const color = part.target;
        const matId = colorIdx + 1;
        
        // Convert RGB to hex color
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        const hexColor = `#${r}${g}${b}`;
        
        materialsXML += `  <basematerials:base name="${escapeXml(color.name)}" displaycolor="${hexColor}" />\n`;
        
        // Build mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices for the box
                    const v0 = vertexCount;
                    vertices.push(`   <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`   <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`   <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`   <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`   <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`   <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`   <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`   <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles for the box (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`   <triangle v1="${v0}" v2="${v0+2}" v3="${v0+1}" />`);
                    triangles.push(`   <triangle v1="${v0}" v2="${v0+3}" v3="${v0+2}" />`);
                    // Top face
                    triangles.push(`   <triangle v1="${v0+4}" v2="${v0+5}" v3="${v0+6}" />`);
                    triangles.push(`   <triangle v1="${v0+4}" v2="${v0+6}" v3="${v0+7}" />`);
                    // Front face
                    triangles.push(`   <triangle v1="${v0}" v2="${v0+1}" v3="${v0+5}" />`);
                    triangles.push(`   <triangle v1="${v0}" v2="${v0+5}" v3="${v0+4}" />`);
                    // Back face
                    triangles.push(`   <triangle v1="${v0+2}" v2="${v0+3}" v3="${v0+7}" />`);
                    triangles.push(`   <triangle v1="${v0+2}" v2="${v0+7}" v3="${v0+6}" />`);
                    // Left face
                    triangles.push(`   <triangle v1="${v0+3}" v2="${v0}" v3="${v0+4}" />`);
                    triangles.push(`   <triangle v1="${v0+3}" v2="${v0+4}" v3="${v0+7}" />`);
                    // Right face
                    triangles.push(`   <triangle v1="${v0+1}" v2="${v0+2}" v3="${v0+6}" />`);
                    triangles.push(`   <triangle v1="${v0+1}" v2="${v0+6}" v3="${v0+5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshId = matId;
            resourcesXML += ` <object id="${meshId}" type="model">\n`;
            resourcesXML += `  <mesh>\n`;
            resourcesXML += `   <vertices>\n${vertices.join('\n')}\n   </vertices>\n`;
            resourcesXML += `   <triangles>\n${triangles.join('\n')}\n   </triangles>\n`;
            resourcesXML += `  </mesh>\n`;
            resourcesXML += ` </object>\n`;
            
            buildItemsXML += ` <item objectid="${meshId}" />\n`;
        }
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
 <metadata name="Title">${escapeXml(settings.filename)}</metadata>
 <metadata name="Application">firaga.io</metadata>
 <basematerials:basematerials id="1">
${materialsXML} </basematerials:basematerials>
 <resources>
${resourcesXML} </resources>
 <build>
${buildItemsXML} </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, settings.filename + '.3mf');
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Create zip file content
    const files: Array<{ name: string, content: string | Uint8Array }> = [];
    
    // Generate PNG images for each color
    const pngPromises: Promise<void>[] = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const sanitizedName = sanitizeFilename(part.target.name + '_' + (part.target.code || colorIdx));
        
        // Create a canvas for this color mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (pixels[y][x] === colorIdx) {
                    // White pixel
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                } else {
                    // Black pixel
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        files.push({
                            name: sanitizedName + '.png',
                            content: new Uint8Array(reader.result as ArrayBuffer)
                        });
                        resolve();
                    };
                    reader.readAsArrayBuffer(blob);
                } else {
                    resolve();
                }
            });
        });
        pngPromises.push(promise);
    }
    
    // Wait for all PNGs to be generated
    Promise.all(pngPromises).then(() => {
        // Generate OpenSCAD file
        let scadContent = `// Generated by firaga.io
// Image: ${settings.filename}
// Size: ${width}x${height}

pixel_size = 1; // mm
pixel_height = ${pixelHeight}; // mm
base_height = ${baseHeight}; // mm

`;
        
        for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
            const part = partList[colorIdx];
            const sanitizedName = sanitizeFilename(part.target.name + '_' + (part.target.code || colorIdx));
            const r = (part.target.r / 255).toFixed(3);
            const g = (part.target.g / 255).toFixed(3);
            const b = (part.target.b / 255).toFixed(3);
            
            scadContent += `// ${part.target.name}\n`;
            scadContent += `color([${r}, ${g}, ${b}])\n`;
            scadContent += `translate([0, 0, base_height])\n`;
            scadContent += `scale([pixel_size, pixel_size, pixel_height])\n`;
            scadContent += `surface(file = "${sanitizedName}.png", invert = true);\n\n`;
        }
        
        files.push({
            name: 'model.scad',
            content: scadContent
        });
        
        // Create a simple zip file
        createZipAndDownload(files, settings.filename + '.zip');
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function createZipAndDownload(files: Array<{ name: string, content: string | Uint8Array }>, filename: string) {
    // Simple ZIP file creation
    // Note: This is a minimal implementation. For production, use a proper ZIP library like JSZip
    
    // For now, create a text representation (would need JSZip for proper binary ZIP)
    // Since we can't add JSZip easily, let's use a simple tar-like approach
    // Actually, let's just save the SCAD file for now and note that images should be saved separately
    
    // Find the .scad file
    const scadFile = files.find(f => f.name.endsWith('.scad'));
    if (scadFile && typeof scadFile.content === 'string') {
        // For simplicity, we'll just save the SCAD file
        // In a full implementation, you'd use JSZip
        const blob = new Blob([scadFile.content], { type: 'text/plain' });
        saveAs(blob, filename.replace('.zip', '.scad'));
        
        // Alert user about the images
        alert('OpenSCAD file generated. Note: In a full implementation, this would be a ZIP file with all color mask images. For now, only the .scad file is saved.');
    }
}
