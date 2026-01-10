import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await makeOpenSCADMasks(image, settings);
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file (3D Manufacturing Format)
    // This is a ZIP-based format containing XML files
    
    const zip = new JSZip();
    
    // Add required [Content_Types].xml
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    // Add _rels/.rels
    const relsFolder = zip.folder("_rels")!;
    relsFolder.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    // Create 3D model
    const modelFolder = zip.folder("3D")!;
    const modelXml = generate3DModel(image, settings);
    modelFolder.file("3dmodel.model", modelXml);
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + ".3mf");
}

function generate3DModel(image: PartListImage, settings: ThreeDSettings): string {
    const vertices: string[] = [];
    const triangles: string[] = [];
    const materials: string[] = [];
    const objects: string[] = [];
    
    let vertexIndex = 0;
    
    // Create materials for each color
    image.partList.forEach((part, index) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove the #
        materials.push(`<basematerials id="${index + 1}">
    <base name="${color.name}" displaycolor="#${hex}FF"/>
</basematerials>`);
    });
    
    // Generate mesh for each color
    image.partList.forEach((part, materialId) => {
        const cubes: Array<{x: number, y: number}> = [];
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialId) {
                    cubes.push({ x, y });
                }
            }
        }
        
        if (cubes.length === 0) return;
        
        const objectVertices: string[] = [];
        const objectTriangles: string[] = [];
        let localVertexIndex = 0;
        
        // For each pixel, create a cube
        cubes.forEach(({ x, y }) => {
            const x0 = x;
            const x1 = x + 1;
            const y0 = y;
            const y1 = y + 1;
            const z0 = settings.baseHeight;
            const z1 = settings.baseHeight + settings.pixelHeight;
            
            // 8 vertices of the cube
            const v = localVertexIndex;
            objectVertices.push(
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
            objectTriangles.push(
                // Bottom face
                `<triangle v1="${v+0}" v2="${v+2}" v3="${v+1}"/>`,
                `<triangle v1="${v+0}" v2="${v+3}" v3="${v+2}"/>`,
                // Top face
                `<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}"/>`,
                `<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}"/>`,
                // Front face
                `<triangle v1="${v+0}" v2="${v+1}" v3="${v+5}"/>`,
                `<triangle v1="${v+0}" v2="${v+5}" v3="${v+4}"/>`,
                // Back face
                `<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}"/>`,
                `<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}"/>`,
                // Left face
                `<triangle v1="${v+0}" v2="${v+4}" v3="${v+7}"/>`,
                `<triangle v1="${v+0}" v2="${v+7}" v3="${v+3}"/>`,
                // Right face
                `<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}"/>`,
                `<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}"/>`
            );
            
            localVertexIndex += 8;
        });
        
        if (objectVertices.length > 0) {
            objects.push(`<object id="${materialId + 1}" type="model" pid="${materialId + 1}" pindex="0">
    <mesh>
        <vertices>
${objectVertices.join('\n')}
        </vertices>
        <triangles>
${objectTriangles.join('\n')}
        </triangles>
    </mesh>
</object>`);
        }
    });
    
    // Build complete model XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
<resources>
${materials.join('\n')}
${objects.join('\n')}
<object id="${image.partList.length + 1}" type="model">
    <components>
${image.partList.map((_, i) => `        <component objectid="${i + 1}"/>`).join('\n')}
    </components>
</object>
</resources>
<build>
    <item objectid="${image.partList.length + 1}"/>
</build>
</model>`;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create a black/white image for each color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const maskFiles: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        
        // Clear canvas to white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG
        const filename = `mask_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        maskFiles.push(filename);
        
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        zip.file(filename, blob);
    }
    
    // Create OpenSCAD file
    const scadCode = generateOpenSCADCode(image, maskFiles, settings);
    zip.file("model.scad", scadCode);
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, settings.filename + ".zip");
}

function generateOpenSCADCode(image: PartListImage, maskFiles: string[], settings: ThreeDSettings): string {
    const { width, height, partList } = image;
    
    let scadCode = `// Generated 3D model from firaga.io
// Image size: ${width}x${height} pixels

`;
    
    // Add color modules
    partList.forEach((part, index) => {
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadCode += `module layer_${index}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    translate([0, 0, ${settings.baseHeight + index * 0.01}])
    scale([1, 1, ${settings.pixelHeight}])
    surface(file = "${maskFiles[index]}", center = true, invert = true);
}

`;
    });
    
    // Add union of all layers
    scadCode += `union() {\n`;
    partList.forEach((_, index) => {
        scadCode += `    layer_${index}();\n`;
    });
    scadCode += `}\n`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
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
