import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const JSZip: any;

export async function export3MF(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create 3MF XML content
    const xml = generate3MFXml(image);
    
    // Add the 3D model file
    zip.file("3D/3dmodel.model", xml);
    
    // Add required metadata files
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
}

export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create one monochrome image per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImage = createMaskImage(image, i);
        zip.file(`color_${i}_${sanitizeFilename(part.target.name)}.png`, maskImage, { base64: true });
    }
    
    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

function generate3MFXml(image: PartListImage): string {
    const pixelHeight = 1.0; // Height of each pixel in 3D space
    const pixelSize = 1.0;   // Size of each pixel
    
    let vertices = '';
    let triangles = '';
    let vertexIndex = 0;
    let triangleIndex = 0;
    
    // Build separate objects for each color
    const objects: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const color = part.target;
        
        let colorVertices = '';
        let colorTriangles = '';
        let localVertexIndex = 0;
        
        // Create boxes for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices for a box
                    const baseIdx = localVertexIndex;
                    colorVertices += `        <vertex x="${x0}" y="${y0}" z="${z0}"/>\n`;
                    colorVertices += `        <vertex x="${x1}" y="${y0}" z="${z0}"/>\n`;
                    colorVertices += `        <vertex x="${x1}" y="${y1}" z="${z0}"/>\n`;
                    colorVertices += `        <vertex x="${x0}" y="${y1}" z="${z0}"/>\n`;
                    colorVertices += `        <vertex x="${x0}" y="${y0}" z="${z1}"/>\n`;
                    colorVertices += `        <vertex x="${x1}" y="${y0}" z="${z1}"/>\n`;
                    colorVertices += `        <vertex x="${x1}" y="${y1}" z="${z1}"/>\n`;
                    colorVertices += `        <vertex x="${x0}" y="${y1}" z="${z1}"/>\n`;
                    
                    // 12 triangles for a box (2 per face, 6 faces)
                    // Bottom face
                    colorTriangles += `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}"/>\n`;
                    colorTriangles += `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}"/>\n`;
                    // Top face
                    colorTriangles += `        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}"/>\n`;
                    colorTriangles += `        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}"/>\n`;
                    // Front face
                    colorTriangles += `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}"/>\n`;
                    colorTriangles += `        <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}"/>\n`;
                    // Back face
                    colorTriangles += `        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}"/>\n`;
                    colorTriangles += `        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}"/>\n`;
                    // Left face
                    colorTriangles += `        <triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}"/>\n`;
                    colorTriangles += `        <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}"/>\n`;
                    // Right face
                    colorTriangles += `        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}"/>\n`;
                    colorTriangles += `        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}"/>\n`;
                    
                    localVertexIndex += 8;
                }
            }
        }
        
        if (localVertexIndex > 0) {
            // Create object for this color
            const colorHex = colorEntryToHex(color).substring(1); // Remove #
            const objectXml = `    <object id="${colorIdx + 1}" type="model">
        <mesh>
            <vertices>
${colorVertices}            </vertices>
            <triangles>
${colorTriangles}            </triangles>
        </mesh>
    </object>`;
            objects.push(objectXml);
        }
    }
    
    // Build the build section (instances of objects)
    let buildItems = '';
    for (let i = 0; i < objects.length; i++) {
        buildItems += `        <item objectid="${i + 1}"/>\n`;
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
${objects.join('\n')}
    </resources>
    <build>
${buildItems}    </build>
</model>`;
}

function createMaskImage(image: PartListImage, colorIndex: number): string {
    // Create a canvas with the image dimensions
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black pixels where this color appears
    ctx.fillStyle = 'black';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    // Convert to base64 PNG
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1]; // Return just the base64 part
}

function generateOpenSCADFile(image: PartListImage): string {
    let scadCode = `// Generated OpenSCAD file for 3D display
// Image size: ${image.width}x${image.height}

pixel_size = 1.0;  // Size of each pixel
pixel_height = 1.0; // Height of each pixel layer

`;
    
    // Add a module for each color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const colorName = sanitizeFilename(part.target.name);
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadCode += `// ${part.target.name} (${part.count} pixels)\n`;
        scadCode += `module color_${i}_${colorName}() {\n`;
        scadCode += `    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]) {\n`;
        scadCode += `        scale([pixel_size, pixel_size, pixel_height])\n`;
        scadCode += `            surface(file = "color_${i}_${colorName}.png", center = false, invert = true);\n`;
        scadCode += `    }\n`;
        scadCode += `}\n\n`;
    }
    
    // Add the main display code
    scadCode += `// Display all colors\n`;
    for (let i = 0; i < image.partList.length; i++) {
        const colorName = sanitizeFilename(image.partList[i].target.name);
        scadCode += `color_${i}_${colorName}();\n`;
    }
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
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

async function loadJSZip() {
    return new Promise<void>((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error("Failed to load JSZip"));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve();
        }
    });
}
