import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    height: number; // Height per layer in mm
    baseHeight: number; // Base height in mm
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    await loadJSZipAnd(() => {
        if (settings.format === "3mf") {
            generate3MF(image, settings);
        } else {
            generateOpenSCAD(image, settings);
        }
    });
}

async function loadJSZipAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag1 = document.createElement("script");
        tag1.id = tagName;
        tag1.onload = () => {
            func();
        };
        tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag1);
    } else {
        func();
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    
    // Create a 3MF file (which is a ZIP archive)
    const zip = new JSZip();
    
    // Add required 3MF structure
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    zip.folder("3D")!.file("3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.3mf";
    a.click();
    URL.revokeObjectURL(url);
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, index) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        xml += `
            <base name="${part.target.name}" displaycolor="#${hex}" />`;
    });
    
    xml += `
        </basematerials>`;
    
    // Generate mesh for each color
    let objectId = 2;
    image.partList.forEach((part, partIndex) => {
        const mesh = generateMeshForColor(image, partIndex, settings);
        if (mesh.vertices.length > 0) {
            xml += `
        <object id="${objectId}" type="model" pid="1" pindex="${partIndex}">
            <mesh>
                <vertices>`;
            
            mesh.vertices.forEach(v => {
                xml += `
                    <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`;
            });
            
            xml += `
                </vertices>
                <triangles>`;
            
            mesh.triangles.forEach(t => {
                xml += `
                    <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`;
            });
            
            xml += `
                </triangles>
            </mesh>
        </object>`;
            objectId++;
        }
    });
    
    xml += `
    </resources>
    <build>`;
    
    // Add all objects to build
    for (let id = 2; id < objectId; id++) {
        xml += `
        <item objectid="${id}" />`;
    }
    
    xml += `
    </build>
</model>`;
    
    return xml;
}

interface Vertex {
    x: number;
    y: number;
    z: number;
}

interface Triangle {
    v1: number;
    v2: number;
    v3: number;
}

interface Mesh {
    vertices: Vertex[];
    triangles: Triangle[];
}

function generateMeshForColor(image: PartListImage, partIndex: number, settings: ThreeDSettings): Mesh {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    const pixelSize = 1; // 1mm per pixel
    
    // For each pixel of this color, create a cube
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                const baseZ = settings.baseHeight;
                const topZ = baseZ + settings.height;
                
                // Add vertices for a cube (8 vertices)
                const baseIndex = vertices.length;
                
                // Bottom face
                vertices.push({ x: x * pixelSize, y: y * pixelSize, z: baseZ });
                vertices.push({ x: (x + 1) * pixelSize, y: y * pixelSize, z: baseZ });
                vertices.push({ x: (x + 1) * pixelSize, y: (y + 1) * pixelSize, z: baseZ });
                vertices.push({ x: x * pixelSize, y: (y + 1) * pixelSize, z: baseZ });
                
                // Top face
                vertices.push({ x: x * pixelSize, y: y * pixelSize, z: topZ });
                vertices.push({ x: (x + 1) * pixelSize, y: y * pixelSize, z: topZ });
                vertices.push({ x: (x + 1) * pixelSize, y: (y + 1) * pixelSize, z: topZ });
                vertices.push({ x: x * pixelSize, y: (y + 1) * pixelSize, z: topZ });
                
                // Add triangles for all 6 faces (12 triangles total)
                // Bottom face
                triangles.push({ v1: baseIndex + 0, v2: baseIndex + 2, v3: baseIndex + 1 });
                triangles.push({ v1: baseIndex + 0, v2: baseIndex + 3, v3: baseIndex + 2 });
                
                // Top face
                triangles.push({ v1: baseIndex + 4, v2: baseIndex + 5, v3: baseIndex + 6 });
                triangles.push({ v1: baseIndex + 4, v2: baseIndex + 6, v3: baseIndex + 7 });
                
                // Front face
                triangles.push({ v1: baseIndex + 0, v2: baseIndex + 1, v3: baseIndex + 5 });
                triangles.push({ v1: baseIndex + 0, v2: baseIndex + 5, v3: baseIndex + 4 });
                
                // Right face
                triangles.push({ v1: baseIndex + 1, v2: baseIndex + 2, v3: baseIndex + 6 });
                triangles.push({ v1: baseIndex + 1, v2: baseIndex + 6, v3: baseIndex + 5 });
                
                // Back face
                triangles.push({ v1: baseIndex + 2, v2: baseIndex + 3, v3: baseIndex + 7 });
                triangles.push({ v1: baseIndex + 2, v2: baseIndex + 7, v3: baseIndex + 6 });
                
                // Left face
                triangles.push({ v1: baseIndex + 3, v2: baseIndex + 0, v3: baseIndex + 4 });
                triangles.push({ v1: baseIndex + 3, v2: baseIndex + 4, v3: baseIndex + 7 });
            }
        }
    }
    
    return { vertices, triangles };
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Generate mask images for each color
    const maskPromises = image.partList.map(async (part, partIndex) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const filename = `mask_${partIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
        zip.file(filename, blob);
        
        return { filename, part };
    });
    
    const masks = await Promise.all(maskPromises);
    
    // Generate OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for layered color display
// Each color is represented as a separate layer using heightmap

`;
    
    masks.forEach(({ filename, part }, index) => {
        const hex = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        const z = settings.baseHeight + index * settings.height;
        
        scadContent += `
// Layer ${index}: ${part.target.name}
color([${r}, ${g}, ${b}])
translate([0, 0, ${z}])
scale([1, 1, ${settings.height}])
surface(file = "${filename}", center = true, invert = true);
`;
    });
    
    zip.file("model.scad", scadContent);
    
    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openscad_output.zip";
    a.click();
    URL.revokeObjectURL(url);
}
