import { PartListImage } from "./image-utils";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    depth: number; // Depth/height of each pixel in mm
    pixelSize: number; // Size of each pixel in mm
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFModel(image, settings);
    
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file("[Content_Types].xml", generateContentTypes());
    
    const rels = zip.folder("_rels");
    rels!.file(".rels", generateRels());
    
    const threeD = zip.folder("3D");
    threeD!.file("3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, depth } = settings;
    let objectId = 1;
    let vertexOffset = 0;
    
    let meshes = '';
    let resources = '';
    
    // Create a separate mesh object for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexCount = 0;
        
        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box (8 vertices, 12 triangles)
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = depth;
                    
                    const baseVertex = localVertexCount;
                    
                    // 8 vertices of the box
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    localVertexCount += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 2}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 3}"/>`);
                    // Top face (z1)
                    triangles.push(`<triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 5}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 4}" v2="${baseVertex + 7}" v3="${baseVertex + 6}"/>`);
                    // Front face (y0)
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 1}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 4}" v3="${baseVertex + 5}"/>`);
                    // Back face (y1)
                    triangles.push(`<triangle v1="${baseVertex + 3}" v2="${baseVertex + 2}" v3="${baseVertex + 6}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 3}" v2="${baseVertex + 6}" v3="${baseVertex + 7}"/>`);
                    // Left face (x0)
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 7}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 0}" v2="${baseVertex + 7}" v3="${baseVertex + 4}"/>`);
                    // Right face (x1)
                    triangles.push(`<triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 2}"/>`);
                    triangles.push(`<triangle v1="${baseVertex + 1}" v2="${baseVertex + 5}" v3="${baseVertex + 6}"/>`);
                }
            }
        }
        
        // Only create mesh if there are vertices
        if (vertices.length > 0) {
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            
            resources += `
    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
                ${vertices.join('\n                ')}
            </vertices>
            <triangles>
                ${triangles.join('\n                ')}
            </triangles>
        </mesh>
    </object>
    <basematerials id="${objectId + 1000}">
        <base name="${color.target.name}" displaycolor="${colorHex}"/>
    </basematerials>`;
            
            meshes += `
        <item objectid="${objectId}" pid="${objectId + 1000}" pindex="0"/>`;
            
            objectId++;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${resources}
  </resources>
  <build>
${meshes}
  </build>
</model>`;
}

function toHex(n: number): string {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    const { pixelSize, depth } = settings;
    
    // Create one monochrome image per color
    const imagePromises: Promise<void>[] = [];
    const colorNames: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const sanitizedName = sanitizeFilename(color.target.name);
        colorNames.push(sanitizedName);
        
        // Create a canvas for this color
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
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`${sanitizedName}.png`, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    }
    
    // Wait for all images to be created
    await Promise.all(imagePromises);
    
    // Create the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, colorNames, pixelSize, depth);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and save the zip
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}-openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function generateOpenSCADFile(image: PartListImage, colorNames: string[], pixelSize: number, depth: number): string {
    let scad = `// Generated OpenSCAD file for pixel art 3D display
// Image size: ${image.width}x${image.height}
// Pixel size: ${pixelSize}mm
// Depth: ${depth}mm

pixel_size = ${pixelSize};
pixel_depth = ${depth};

`;
    
    // Add modules for each color
    for (let i = 0; i < colorNames.length; i++) {
        const colorName = colorNames[i];
        scad += `
module layer_${colorName}() {
    surface(file = "${colorName}.png", center = false, invert = true);
    scale([pixel_size, pixel_size, pixel_depth])
        surface(file = "${colorName}.png", center = false, invert = true);
}
`;
    }
    
    // Combine all layers
    scad += `
union() {
`;
    
    for (let i = 0; i < colorNames.length; i++) {
        const colorName = colorNames[i];
        const color = image.partList[i].target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        scad += `    color([${r}, ${g}, ${b}]) layer_${colorName}();\n`;
    }
    
    scad += `}
`;
    
    return scad;
}
