import { PartListImage } from "./image-utils";
import JSZip from "jszip";

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    pixelHeight: number; // Height in mm for each pixel/layer
    pixelSize: number;   // Width/depth in mm for each pixel
    filename: string;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = createThreeMFXML(image, settings);
    
    // Create a zip file with the 3MF structure
    const zip = new JSZip();
    
    // Add content types file
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    // Add relationships
    zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    // Add the 3D model
    zip.folder("3D")!.file("3dmodel.model", xml);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function createThreeMFXML(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelSize, pixelHeight } = settings;
    
    let meshesXML = '';
    let objectsXML = '';
    let objectId = 1;
    
    // Create a separate mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a box (8 vertices, 12 triangles) for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices of the box
                    const baseVertex = vertexCount;
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}"/>`);
                    // Top face (z=z1)
                    triangles.push(`<triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}"/>`);
                    // Front face (y=y0)
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}"/>`);
                    // Back face (y=y1)
                    triangles.push(`<triangle v1="${baseVertex + 2}" v2="${baseVertex + 3}" v3="${baseVertex + 7}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 6}"/>`);
                    // Left face (x=x0)
                    triangles.push(`<triangle v1="${baseVertex + 3}" v2="${baseVertex + 0}" v3="${baseVertex + 4}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex + 7}"/>`);
                    // Right face (x=x1)
                    triangles.push(`<triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}"/>`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
            meshesXML += `
        <mesh>
            <vertices>
                ${vertices.join('\n                ')}
            </vertices>
            <triangles>
                ${triangles.join('\n                ')}
            </triangles>
        </mesh>`;
            
            objectsXML += `
    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
                ${vertices.join('\n                ')}
            </vertices>
            <triangles>
                ${triangles.join('\n                ')}
            </triangles>
        </mesh>
        <metadatagroup>
            <metadata name="Title">${color.target.name}</metadata>
        </metadatagroup>
    </object>`;
            objectId++;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
${objectsXML}
    </resources>
    <build>
${Array.from({ length: objectId - 1 }, (_, i) => `        <item objectid="${i + 1}"/>`).join('\n')}
    </build>
</model>`;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const { pixelSize, pixelHeight } = settings;
    
    const zip = new JSZip();
    
    // Create a mask image for each color
    const imagePromises: Promise<void>[] = [];
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
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
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const colorName = sanitizeFilename(color.target.name);
                    zip.file(`${colorName}.png`, blob);
                }
                resolve();
            }, 'image/png');
        });
        imagePromises.push(promise);
    }
    
    await Promise.all(imagePromises);
    
    // Create the OpenSCAD file
    const scadContent = createOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function createOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList } = image;
    const { pixelSize, pixelHeight } = settings;
    
    let scadCode = `// Generated by firaga.io
// Image size: ${width}x${height} pixels
// Pixel size: ${pixelSize}mm x ${pixelSize}mm
// Pixel height: ${pixelHeight}mm

`;
    
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i];
        const colorName = sanitizeFilename(color.target.name);
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        scadCode += `
// ${color.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])
surface(file = "${colorName}.png", center = true, invert = true);
`;
    }
    
    return scadCode;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
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
