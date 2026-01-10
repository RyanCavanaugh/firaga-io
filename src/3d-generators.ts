import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    pitch: number;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const beadHeight = settings.pitch;
    const beadDiameter = settings.pitch * 0.85;
    const beadRadius = beadDiameter / 2;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
`;

    let objectId = 1;
    const colorObjects: { objectId: number; colorIndex: number }[] = [];

    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const hex = colorEntryToHex(color.target);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const sRGB = `#${hex.slice(1).toUpperCase()}`;

        let vertices = "";
        let triangles = "";
        let vertexIndex = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const xPos = x * settings.pitch;
                    const yPos = y * settings.pitch;
                    
                    const cylinderVertices = generateCylinderVertices(
                        xPos + settings.pitch / 2,
                        yPos + settings.pitch / 2,
                        beadRadius,
                        beadHeight,
                        16
                    );
                    
                    const baseVertexIndex = vertexIndex;
                    for (const v of cylinderVertices) {
                        vertices += `        <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}" />\n`;
                        vertexIndex++;
                    }
                    
                    triangles += generateCylinderTriangles(baseVertexIndex, 16);
                }
            }
        }
        
        if (vertexIndex > 0) {
            xml += `        <object id="${objectId}" type="model">
            <mesh>
                <vertices>
${vertices}                </vertices>
                <triangles>
${triangles}                </triangles>
            </mesh>
        </object>
        <basematerials id="${objectId + 1000}">
            <base name="${color.target.name}" displaycolor="${sRGB}" />
        </basematerials>
`;
            colorObjects.push({ objectId, colorIndex });
            objectId++;
        }
    }

    xml += `        <object id="${objectId}" type="model">
            <components>
`;
    
    for (const obj of colorObjects) {
        xml += `                <component objectid="${obj.objectId}" pid="${obj.objectId + 1000}" pindex="0" />\n`;
    }
    
    xml += `            </components>
        </object>
    </resources>
    <build>
        <item objectid="${objectId}" />
    </build>
</model>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

interface Vertex {
    x: number;
    y: number;
    z: number;
}

function generateCylinderVertices(
    centerX: number,
    centerY: number,
    radius: number,
    height: number,
    segments: number
): Vertex[] {
    const vertices: Vertex[] = [];
    
    vertices.push({ x: centerX, y: centerY, z: 0 });
    
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        vertices.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            z: 0
        });
    }
    
    vertices.push({ x: centerX, y: centerY, z: height });
    
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        vertices.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            z: height
        });
    }
    
    return vertices;
}

function generateCylinderTriangles(baseIndex: number, segments: number): string {
    let triangles = "";
    
    for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        triangles += `                    <triangle v1="${baseIndex}" v2="${baseIndex + 1 + i}" v3="${baseIndex + 1 + next}" />\n`;
    }
    
    const topCenterIndex = baseIndex + segments + 1;
    for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        triangles += `                    <triangle v1="${topCenterIndex}" v2="${topCenterIndex + 1 + next}" v3="${topCenterIndex + 1 + i}" />\n`;
    }
    
    for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const bottomRing = baseIndex + 1 + i;
        const bottomRingNext = baseIndex + 1 + next;
        const topRing = topCenterIndex + 1 + i;
        const topRingNext = topCenterIndex + 1 + next;
        
        triangles += `                    <triangle v1="${bottomRing}" v2="${topRing}" v3="${topRingNext}" />\n`;
        triangles += `                    <triangle v1="${bottomRing}" v2="${topRingNext}" v3="${bottomRingNext}" />\n`;
    }
    
    return triangles;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const dataURL = canvas.toDataURL("image/png");
        const base64Data = dataURL.split(",")[1];
        zip.file(`color_${colorIndex}_${sanitizeFilename(color.target.name)}.png`, base64Data, { base64: true });
    }
    
    let scadContent = `// OpenSCAD file for ${settings.filename}
// Generated by firaga.io

pixel_size = ${settings.pitch.toFixed(3)};
bead_height = ${settings.pitch.toFixed(3)};
bead_diameter = ${(settings.pitch * 0.85).toFixed(3)};

module bead_layer(image_file, color_name) {
    surface(file = image_file, center = true, invert = true);
    scale([pixel_size, pixel_size, bead_height])
    linear_extrude(height = 1)
    scale([1 / pixel_size, 1 / pixel_size, 1])
    import(image_file);
}

union() {
`;

    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const filename = `color_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        const hex = colorEntryToHex(color.target);
        scadContent += `    // ${color.target.name} (${hex})\n`;
        scadContent += `    color("${hex}")\n`;
        scadContent += `    bead_layer("${filename}", "${color.target.name}");\n\n`;
    }

    scadContent += `}
`;

    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
