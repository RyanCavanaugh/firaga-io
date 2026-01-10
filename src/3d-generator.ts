import { PartListImage } from "./image-utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    layerHeight: number;
}

export async function export3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    
    // For now, create a simple text file with 3MF content
    // A full implementation would require a zip library
    const blob = new Blob([xml], { type: 'application/xml' });
    downloadBlob(blob, "pixelart.3mf.xml");
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const layerHeight = settings.layerHeight;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    partList.forEach((part, index) => {
        const color = part.target;
        const r = Math.round(color.r).toString(16).padStart(2, '0');
        const g = Math.round(color.g).toString(16).padStart(2, '0');
        const b = Math.round(color.b).toString(16).padStart(2, '0');
        xml += `\n            <base name="${color.name}" displaycolor="#${r}${g}${b}FF"/>`;
    });
    
    xml += `\n        </basematerials>`;
    
    // Create objects for each color
    partList.forEach((part, partIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    // Create a cube for this pixel
                    const baseIdx = vertexCount;
                    
                    // 8 vertices for a cube
                    vertices.push(`<vertex x="${x}" y="${y}" z="0"/>`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="0"/>`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="0"/>`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="0"/>`);
                    vertices.push(`<vertex x="${x}" y="${y}" z="${layerHeight}"/>`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="${layerHeight}"/>`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="${layerHeight}"/>`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="${layerHeight}"/>`);
                    
                    // 12 triangles for a cube (2 per face)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}"/>`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `\n        <object id="${partIndex + 2}" type="model">
            <mesh>
                <vertices>
                    ${vertices.join('\n                    ')}
                </vertices>
                <triangles>
                    ${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`;
        }
    });
    
    xml += `\n    </resources>
    <build>`;
    
    // Add components for each color with their material
    partList.forEach((part, index) => {
        xml += `\n        <item objectid="${index + 2}" partnumber="${index}"/>`;
    });
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

async function exportOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, pixels, partList } = image;
    
    // Create a simple multi-file download by creating individual files
    // This is a simplified version - a real implementation would create a zip
    
    // Generate OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for pixel art
// Image size: ${width}x${height}
// 
// To use this file:
// 1. Export the mask images for each color (download separately)
// 2. Place all mask PNG files in the same directory as this .scad file
// 3. Open in OpenSCAD and render

$fn = 32; // Circle resolution
layer_height = ${settings.layerHeight};
pixel_size = 1;

// Combine all layers
union() {
`;
    
    partList.forEach((part, index) => {
        const color = part.target;
        const maskFile = `mask_${index}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        scadContent += `    // ${part.target.name}
    color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])
    translate([0, 0, ${index * settings.layerHeight}])
    scale([pixel_size, pixel_size, layer_height])
    surface(file = "${maskFile}", center = true, invert = true);
    
`;
    });
    
    scadContent += `}
`;
    
    // Download the OpenSCAD file
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    downloadBlob(scadBlob, "pixelart.scad");
    
    // Create and download mask images
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `mask_${partIndex}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        
        // Add a small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
        downloadBlob(blob, filename);
    }
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
