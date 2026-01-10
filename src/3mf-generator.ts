import { PartListImage } from "./image-utils";
import { ThreeDExportSettings } from "./components/3d-export-dialog";
import { saveAs } from "file-saver";

export function generate3MF(image: PartListImage, settings: ThreeDExportSettings) {
    const xml = build3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeDExportSettings): string {
    const depth = 2.0; // Depth of each pixel in mm
    const pixelSize = settings.pitch * 25.4; // Convert inches to mm
    
    let materialXml = '';
    let objectsXml = '';
    let buildItemsXml = '';
    
    // Build materials section
    materialXml += '  <resources>\n';
    materialXml += '    <basematerials id="1">\n';
    
    image.partList.forEach((part, idx) => {
        const r = part.target.r;
        const g = part.target.g;
        const b = part.target.b;
        const colorHex = rgbToHex(r, g, b);
        materialXml += `      <base name="${part.target.name}" displaycolor="${colorHex}" />\n`;
    });
    
    materialXml += '    </basematerials>\n';
    
    // Build objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = depth;
                    
                    const baseVertex = vertexCount;
                    
                    // 8 vertices of the cube
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`        <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}" />`);
                    // Top face
                    triangles.push(`        <triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`);
                    // Front face
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}" />`);
                    // Back face
                    triangles.push(`        <triangle v1="${baseVertex + 2}" v2="${baseVertex + 3}" v3="${baseVertex + 7}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    // Left face
                    triangles.push(`        <triangle v1="${baseVertex + 3}" v2="${baseVertex + 0}" v3="${baseVertex + 4}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    // Right face
                    triangles.push(`        <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`        <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const objectId = colorIdx + 2;
            objectsXml += `    <object id="${objectId}" type="model">\n`;
            objectsXml += `      <mesh>\n`;
            objectsXml += `      <vertices>\n`;
            objectsXml += vertices.join('\n') + '\n';
            objectsXml += `      </vertices>\n`;
            objectsXml += `      <triangles>\n`;
            objectsXml += triangles.join('\n') + '\n';
            objectsXml += `      </triangles>\n`;
            objectsXml += `      </mesh>\n`;
            objectsXml += `    </object>\n`;
            
            buildItemsXml += `    <item objectid="${objectId}" />\n`;
        }
    });
    
    materialXml += objectsXml;
    materialXml += '  </resources>\n';
    
    // Build the complete 3MF XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += materialXml;
    xml += '  <build>\n';
    xml += buildItemsXml;
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16).padStart(2, '0');
        return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
