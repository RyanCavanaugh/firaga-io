import { PartListImage } from "./image-utils";
import JSZip from "jszip";

export interface Export3DSettings {
    format: "3mf" | "openscad";
    height: number; // Height in mm for each pixel
    baseThickness: number; // Base plate thickness in mm
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const xml = generate3MF(image, settings);
    
    // Create a zip file with the 3MF structure
    const zip = new JSZip();
    
    // Add content types file
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    // Add _rels/.rels file
    zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    // Add 3D/3dmodel.model file
    zip.folder("3D")!.file("3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model.3mf");
}

function generate3MF(image: PartListImage, settings: Export3DSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, index) => {
        const r = Math.round(part.target.r);
        const g = Math.round(part.target.g);
        const b = Math.round(part.target.b);
        xml += `
            <base name="${escapeXml(part.target.name)}" displaycolor="#${toHex(r)}${toHex(g)}${toHex(b)}" />`;
    });
    
    xml += `
        </basematerials>`;
    
    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    image.partList.forEach((part, colorIndex) => {
        const meshData = createMeshForColor(image, colorIndex, settings);
        if (meshData.vertices.length > 0) {
            xml += `
        <object id="${objectId}" type="model">
            <mesh>
                <vertices>`;
            
            meshData.vertices.forEach(v => {
                xml += `
                    <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`;
            });
            
            xml += `
                </vertices>
                <triangles>`;
            
            meshData.triangles.forEach(t => {
                xml += `
                    <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIndex}" />`;
            });
            
            xml += `
                </triangles>
            </mesh>
        </object>`;
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    xml += `
    </resources>
    <build>`;
    
    objectIds.forEach(id => {
        xml += `
        <item objectid="${id}" />`;
    });
    
    xml += `
    </build>
</model>`;
    
    return xml;
}

function createMeshForColor(image: PartListImage, colorIndex: number, settings: Export3DSettings): { vertices: number[][], triangles: number[][] } {
    const vertices: number[][] = [];
    const triangles: number[][] = [];
    
    // Generate cubes for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                const cubeVertices = createCube(x, y, settings);
                const baseIndex = vertices.length;
                vertices.push(...cubeVertices);
                
                // Add triangles for the cube (12 triangles for 6 faces)
                const cubeTriangles = [
                    // Bottom
                    [0, 1, 2], [0, 2, 3],
                    // Top
                    [4, 6, 5], [4, 7, 6],
                    // Front
                    [0, 4, 5], [0, 5, 1],
                    // Back
                    [2, 6, 7], [2, 7, 3],
                    // Left
                    [0, 3, 7], [0, 7, 4],
                    // Right
                    [1, 5, 6], [1, 6, 2]
                ];
                
                cubeTriangles.forEach(tri => {
                    triangles.push([
                        baseIndex + tri[0],
                        baseIndex + tri[1],
                        baseIndex + tri[2]
                    ]);
                });
            }
        }
    }
    
    return { vertices, triangles };
}

function createCube(x: number, y: number, settings: Export3DSettings): number[][] {
    // Each pixel is 1mm x 1mm in the XY plane
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = 0;
    const z1 = settings.baseThickness + settings.height;
    
    return [
        [x0, y0, z0], // 0
        [x1, y0, z0], // 1
        [x1, y1, z0], // 2
        [x0, y1, z0], // 3
        [x0, y0, z1], // 4
        [x1, y0, z1], // 5
        [x1, y1, z1], // 6
        [x0, y1, z1]  // 7
    ];
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    // Generate one PNG for each color
    const imageFiles: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (empty)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black where this color exists
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === i) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${i}_${sanitizeFilename(image.partList[i].target.name)}.png`;
        imageFiles.push(filename);
        zip.file(filename, blob);
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated 3D model from firaga.io
// Width: ${image.width}px, Height: ${image.height}px

`;
    
    image.partList.forEach((part, i) => {
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadContent += `// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    surface(file="${imageFiles[i]}", center=true, invert=true);

`;
    });
    
    zip.file("model.scad", scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "model-openscad.zip");
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
