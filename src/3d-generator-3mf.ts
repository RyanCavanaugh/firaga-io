import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    carveSize: readonly [number, number];
    pitch: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    // 3MF file structure - simplified version
    // Each pixel becomes a small cube extruded upward
    const pixelHeight = settings.pitch;
    const pixelWidth = settings.pitch;
    const pixelDepth = settings.pitch * 0.5; // Half the pitch for depth
    
    let objectId = 1;
    const objects: string[] = [];
    const components: string[] = [];
    
    // Create a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexOffset = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * pixelWidth;
                    const y0 = y * pixelHeight;
                    const z0 = 0;
                    const x1 = x0 + pixelWidth;
                    const y1 = y0 + pixelHeight;
                    const z1 = z0 + pixelDepth;
                    
                    // 8 vertices of the cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    const v = vertexOffset;
                    // Bottom face
                    triangles.push(`<triangle v1="${v+0}" v2="${v+1}" v3="${v+2}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+2}" v3="${v+3}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+5}"/>`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+7}" v3="${v+6}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${v+0}" v2="${v+4}" v3="${v+5}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+5}" v3="${v+1}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${v+2}" v2="${v+6}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+3}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${v+0}" v2="${v+3}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v+0}" v2="${v+7}" v3="${v+4}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${v+1}" v2="${v+5}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+2}"/>`);
                    
                    vertexOffset += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            
            objects.push(`
    <object id="${objectId}" type="model">
        <mesh>
            <vertices>
                ${vertices.join('\n                ')}
            </vertices>
            <triangles>
                ${triangles.join('\n                ')}
            </triangles>
        </mesh>
    </object>`);
            
            components.push(`<component objectid="${objectId}" />`);
            objectId++;
        }
    }
    
    // Build the complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        ${objects.join('\n        ')}
        <object id="${objectId}" type="model">
            <components>
                ${components.join('\n                ')}
            </components>
        </object>
    </resources>
    <build>
        <item objectid="${objectId}" />
    </build>
</model>`;
    
    return xml;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}
