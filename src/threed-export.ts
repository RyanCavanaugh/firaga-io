import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    pixelHeight: number;
    baseHeight: number;
    filename: string;
};

export async function export3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Add 3MF content types
    zip.file("[Content_Types].xml", generateContentTypes());
    
    // Add relationships
    const relsFolder = zip.folder("_rels");
    relsFolder.file(".rels", generateRootRels());
    
    // Add 3D model
    const modelFolder = zip.folder("3D");
    modelFolder.file("3dmodel.model", generate3DModel(image, settings));
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate a mask image for each color
    for (let i = 0; i < image.partList.length; i++) {
        const partEntry = image.partList[i];
        const maskData = await generateMaskForColor(image, i);
        zip.file(`color_${i}_${partEntry.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, maskData);
    }
    
    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRootRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3DModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, baseHeight } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((entry, idx) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove #
        xml += `\n            <base name="${escapeXml(entry.target.name)}" displaycolor="#${color}FF"/>`;
    });
    
    xml += `\n        </basematerials>`;
    
    // Generate mesh objects for each color
    image.partList.forEach((entry, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const cube = generateCube(x, y, pixelHeight, baseHeight);
                    const baseVertex = vertexCount;
                    
                    cube.vertices.forEach(v => vertices.push(v));
                    cube.triangles.forEach(t => {
                        const [v1, v2, v3] = t.split(' ').map(n => parseInt(n) + baseVertex);
                        triangles.push(`${v1} ${v2} ${v3}`);
                    });
                    
                    vertexCount += 8; // 8 vertices per cube
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `\n        <object id="${colorIdx + 2}" type="model">
            <mesh>
                <vertices>`;
            vertices.forEach(v => {
                xml += `\n                    <vertex x="${v.split(' ')[0]}" y="${v.split(' ')[1]}" z="${v.split(' ')[2]}"/>`;
            });
            xml += `\n                </vertices>
                <triangles>`;
            triangles.forEach(t => {
                const [v1, v2, v3] = t.split(' ');
                xml += `\n                    <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIdx}"/>`;
            });
            xml += `\n                </triangles>
            </mesh>
        </object>`;
        }
    });
    
    xml += `\n    </resources>
    <build>`;
    
    // Add build items for each color mesh
    image.partList.forEach((_, colorIdx) => {
        xml += `\n        <item objectid="${colorIdx + 2}"/>`;
    });
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

function generateCube(x: number, y: number, height: number, baseHeight: number): { vertices: string[], triangles: string[] } {
    const x0 = x, x1 = x + 1;
    const y0 = y, y1 = y + 1;
    const z0 = baseHeight, z1 = baseHeight + height;
    
    const vertices = [
        `${x0} ${y0} ${z0}`, // 0
        `${x1} ${y0} ${z0}`, // 1
        `${x1} ${y1} ${z0}`, // 2
        `${x0} ${y1} ${z0}`, // 3
        `${x0} ${y0} ${z1}`, // 4
        `${x1} ${y0} ${z1}`, // 5
        `${x1} ${y1} ${z1}`, // 6
        `${x0} ${y1} ${z1}`, // 7
    ];
    
    const triangles = [
        // Bottom face (z0)
        "0 1 2", "0 2 3",
        // Top face (z1)
        "4 6 5", "4 7 6",
        // Front face (y0)
        "0 5 1", "0 4 5",
        // Back face (y1)
        "3 2 6", "3 6 7",
        // Left face (x0)
        "0 3 7", "0 7 4",
        // Right face (x1)
        "1 5 6", "1 6 2",
    ];
    
    return { vertices, triangles };
}

function generateMaskForColor(image: PartListImage, colorIndex: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            
            // White for this color, black for others/transparent
            imageData.data[idx] = isColor ? 255 : 0;
            imageData.data[idx + 1] = isColor ? 255 : 0;
            imageData.data[idx + 2] = isColor ? 255 : 0;
            imageData.data[idx + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelHeight, baseHeight } = settings;
    
    let scad = `// Generated by firaga.io
// Image size: ${image.width}x${image.height}

pixel_height = ${pixelHeight};
base_height = ${baseHeight};
image_width = ${image.width};
image_height = ${image.height};

module pixel_layer(mask_file, color) {
    color(color) {
        surface(file = mask_file, center = true, invert = true);
        scale([1, 1, pixel_height]) {
            linear_extrude(height = 1) {
                import(mask_file);
            }
        }
    }
}

`;
    
    // Add base
    scad += `// Base layer
color("white")
    translate([image_width/2, image_height/2, base_height/2])
    cube([image_width, image_height, base_height], center = true);

`;
    
    // Add each color layer
    image.partList.forEach((entry, idx) => {
        const filename = `color_${idx}_${entry.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const hex = colorEntryToHex(entry.target);
        
        scad += `// ${entry.target.name}
translate([0, 0, base_height])
    pixel_layer("${filename}", "${hex}");

`;
    });
    
    return scad;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = reject;
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve();
        }
    });
}
