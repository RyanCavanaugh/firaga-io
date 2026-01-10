import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeMfSettings = {
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
};

export function generate3mf(image: PartListImage, settings: ThreeMfSettings): Blob {
    const parts: string[] = [];
    
    // Build 3D Model XML structure
    parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    parts.push('<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">');
    parts.push('<resources>');
    
    let objectId = 1;
    const colorObjects: { id: number; materialId: number }[] = [];
    
    // Create materials for each color
    parts.push('<basematerials id="1">');
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const color = hex.substring(1); // Remove #
        parts.push(`<base name="${part.target.name}" displaycolor="${color}FF" />`);
    });
    parts.push('</basematerials>');
    
    // Generate mesh for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertexCount;
                    const x0 = x * settings.pixelWidth;
                    const x1 = (x + 1) * settings.pixelWidth;
                    const y0 = y * settings.pixelDepth;
                    const y1 = (y + 1) * settings.pixelDepth;
                    const z0 = 0;
                    const z1 = settings.pixelHeight;
                    
                    // 8 vertices for a cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face (z1)
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face (y0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face (y1)
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face (x0)
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face (x1)
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objectId++;
            parts.push(`<object id="${objectId}" type="model">`);
            parts.push('<mesh>');
            parts.push('<vertices>');
            parts.push(vertices.join('\n'));
            parts.push('</vertices>');
            parts.push('<triangles>');
            triangles.forEach(tri => {
                parts.push(tri.replace('/>', ` pid="1" p1="${colorIdx}" />`));
            });
            parts.push('</triangles>');
            parts.push('</mesh>');
            parts.push('</object>');
            
            colorObjects.push({ id: objectId, materialId: colorIdx });
        }
    });
    
    // Build component that references all color objects
    objectId++;
    parts.push(`<object id="${objectId}" type="model">`);
    parts.push('<components>');
    colorObjects.forEach(obj => {
        parts.push(`<component objectid="${obj.id}" />`);
    });
    parts.push('</components>');
    parts.push('</object>');
    
    parts.push('</resources>');
    parts.push(`<build>`);
    parts.push(`<item objectid="${objectId}" />`);
    parts.push('</build>');
    parts.push('</model>');
    
    const modelXml = parts.join('\n');
    
    // Create 3MF package (simplified - proper 3MF is a zip with multiple files)
    // For now, return just the model XML
    return new Blob([modelXml], { type: 'application/xml' });
}
