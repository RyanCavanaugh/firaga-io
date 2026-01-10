import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3DSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
};

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const { saveAs } = await import("file-saver");
    const xml = generate3MF(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MF(image: PartListImage, settings: Export3DSettings): string {
    const { pitch, height } = settings;
    
    let vertexId = 1;
    let triangleId = 1;
    const meshes: string[] = [];
    const resources: string[] = [];
    const builds: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    const baseVertexId = vertexId;
                    
                    // 8 vertices of a cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    vertexId += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    const v = baseVertexId - 1;
                    
                    // Bottom face
                    triangles.push(`<triangle v1="${v}" v2="${v + 2}" v3="${v + 1}" />`);
                    triangles.push(`<triangle v1="${v}" v2="${v + 3}" v3="${v + 2}" />`);
                    
                    // Top face
                    triangles.push(`<triangle v1="${v + 4}" v2="${v + 5}" v3="${v + 6}" />`);
                    triangles.push(`<triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 7}" />`);
                    
                    // Front face
                    triangles.push(`<triangle v1="${v}" v2="${v + 1}" v3="${v + 5}" />`);
                    triangles.push(`<triangle v1="${v}" v2="${v + 5}" v3="${v + 4}" />`);
                    
                    // Back face
                    triangles.push(`<triangle v1="${v + 3}" v2="${v + 7}" v3="${v + 6}" />`);
                    triangles.push(`<triangle v1="${v + 3}" v2="${v + 6}" v3="${v + 2}" />`);
                    
                    // Left face
                    triangles.push(`<triangle v1="${v}" v2="${v + 4}" v3="${v + 7}" />`);
                    triangles.push(`<triangle v1="${v}" v2="${v + 7}" v3="${v + 3}" />`);
                    
                    // Right face
                    triangles.push(`<triangle v1="${v + 1}" v2="${v + 2}" v3="${v + 6}" />`);
                    triangles.push(`<triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 5}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            const colorHex = colorEntryToHex(part.target).substring(1);
            const objectId = colorIndex + 1;
            const materialId = colorIndex + 1;
            
            resources.push(`<basematerials id="${materialId}">
    <base name="${part.target.name}" displaycolor="#${colorHex}" />
</basematerials>`);
            
            resources.push(`<object id="${objectId}" type="model">
    <mesh>
        <vertices>
${vertices.join('\n            ')}
        </vertices>
        <triangles>
${triangles.join('\n            ')}
        </triangles>
    </mesh>
</object>`);
            
            builds.push(`<item objectid="${objectId}" />`);
        }
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
${resources.join('\n        ')}
    </resources>
    <build>
${builds.join('\n        ')}
    </build>
</model>`;
    
    return xml;
}

async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const JSZip = (await import("jszip" as any)).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        zip.file(`${sanitizedName}.png`, blob);
    }
    
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("display.scad", scadContent);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { pitch, height } = settings;
    const lines: string[] = [];
    
    lines.push(`// Generated by firaga.io`);
    lines.push(`// Image size: ${image.width}x${image.height}`);
    lines.push(`pitch = ${pitch};`);
    lines.push(`height = ${height};`);
    lines.push(`img_width = ${image.width};`);
    lines.push(`img_height = ${image.height};`);
    lines.push(``);
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, "_");
        const rgb = [
            part.target.r / 255,
            part.target.g / 255,
            part.target.b / 255
        ];
        
        lines.push(`// ${part.target.name}`);
        lines.push(`color([${rgb[0].toFixed(3)}, ${rgb[1].toFixed(3)}, ${rgb[2].toFixed(3)}])`);
        lines.push(`translate([0, 0, 0])`);
        lines.push(`scale([pitch, pitch, height])`);
        lines.push(`surface(file = "${sanitizedName}.png", center = false, invert = true);`);
        lines.push(``);
    }
    
    return lines.join('\n');
}
