import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    thickness: number;
    carveSize: readonly [number, number];
    pitch: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { pitch } = settings;
    const thickness = settings.thickness;
    
    // Build 3MF XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `            <base name="${part.target.name}" displaycolor="#${hexColor}" />\n`;
    });

    xml += `        </basematerials>\n`;

    // Create separate objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Find all pixels of this color and create boxes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = thickness;

                    // Add 8 vertices for a cube
                    const baseIdx = vertexCount;
                    vertices.push(`                <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`                <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`                <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`                <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`                <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`                <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`                <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`                <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`                <triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 2}" />`);
                    triangles.push(`                <triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 3}" />`);
                    // Top face (z1)
                    triangles.push(`                <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    triangles.push(`                <triangle v1="${baseIdx + 4}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Front face
                    triangles.push(`                <triangle v1="${baseIdx + 0}" v2="${baseIdx + 4}" v3="${baseIdx + 5}" />`);
                    triangles.push(`                <triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 1}" />`);
                    // Back face
                    triangles.push(`                <triangle v1="${baseIdx + 2}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    triangles.push(`                <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Left face
                    triangles.push(`                <triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`                <triangle v1="${baseIdx + 0}" v2="${baseIdx + 7}" v3="${baseIdx + 4}" />`);
                    // Right face
                    triangles.push(`                <triangle v1="${baseIdx + 1}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`                <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 2}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            xml += `        <object id="${colorIdx + 2}" type="model">\n`;
            xml += `            <mesh>\n`;
            xml += `            <vertices>\n`;
            xml += vertices.join('\n') + '\n';
            xml += `            </vertices>\n`;
            xml += `            <triangles>\n`;
            xml += triangles.join('\n') + '\n';
            xml += `            </triangles>\n`;
            xml += `            </mesh>\n`;
            xml += `        </object>\n`;
        }
    });

    xml += `    </resources>\n`;
    xml += `    <build>\n`;

    // Add each object to the build with its material
    image.partList.forEach((part, idx) => {
        xml += `        <item objectid="${idx + 2}" />\n`;
    });

    xml += `    </build>\n`;
    xml += `</model>`;

    // Save the file
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}
