import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DFormat = '3mf' | 'openscad';

export interface Export3DSettings {
    format: Export3DFormat;
    pixelHeight: number;
    pixelSize: number;
}

/**
 * Generate 3MF file with separate material shapes per color
 */
export function generate3MF(image: PartListImage, settings: Export3DSettings): Blob {
    const { pixelHeight, pixelSize } = settings;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials for each color
    xml += '    <basematerials id="1">\n';
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Create a mesh for each color
    image.partList.forEach((part, materialIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels with this color and generate cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    addCube(vertices, triangles, x * pixelSize, y * pixelSize, 0, pixelSize, pixelSize, pixelHeight);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${materialIdx + 2}" type="model">\n`;
            xml += '      <mesh>\n';
            xml += '        <vertices>\n';
            vertices.forEach(([x, y, z]) => {
                xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
            });
            xml += '        </vertices>\n';
            xml += '        <triangles>\n';
            triangles.forEach(([v1, v2, v3]) => {
                xml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${materialIdx}" />\n`;
            });
            xml += '        </triangles>\n';
            xml += '      </mesh>\n';
            xml += '    </object>\n';
        }
    });
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add each object to the build with its material
    image.partList.forEach((part, materialIdx) => {
        xml += `    <item objectid="${materialIdx + 2}" />\n`;
    });
    
    xml += '  </build>\n';
    xml += '</model>\n';
    
    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

/**
 * Generate OpenSCAD masks as a ZIP file
 */
export async function generateOpenSCADMasks(image: PartListImage, settings: Export3DSettings): Promise<Blob> {
    const { pixelHeight, pixelSize } = settings;
    
    // Since we don't have JSZip bundled, we'll create a simple tar-like bundle
    // Or download each file separately
    // For now, let's just create a single combined file with instructions
    
    const parts: string[] = [];
    parts.push('# firaga.io 3D Export - OpenSCAD Masks\n');
    parts.push('# This package contains mask images and an OpenSCAD file.\n\n');
    
    // Generate OpenSCAD file content
    const scadContent = generateSCADFile(image, pixelHeight, pixelSize);
    parts.push('## File: display.scad\n');
    parts.push('```\n');
    parts.push(scadContent);
    parts.push('\n```\n\n');
    
    // For each mask, we'll trigger separate downloads
    // This is a workaround until we add JSZip
    const masks = await Promise.all(
        image.partList.map((part, i) => 
            generateMaskImage(image, i).then(blob => ({
                name: `mask_${i}_${sanitizeFilename(part.target.name)}.png`,
                blob
            }))
        )
    );
    
    // Download masks separately
    setTimeout(() => {
        masks.forEach((mask, idx) => {
            setTimeout(() => {
                downloadBlob(mask.blob, mask.name);
            }, idx * 200);
        });
    }, 100);
    
    // Return the SCAD file as the main download
    return new Blob([scadContent], { type: 'text/plain' });
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateMaskImage(image: PartListImage, colorIndex: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        return Promise.reject(new Error('Could not get canvas context'));
    }
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    // Create black and white mask
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 255 : 0;
            
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob from canvas'));
            }
        }, 'image/png');
    });
}

function generateSCADFile(image: PartListImage, pixelHeight: number, pixelSize: number): string {
    let scad = '// Generated by firaga.io\n';
    scad += '// 3D display using heightmap\n\n';
    
    scad += `pixel_size = ${pixelSize};\n`;
    scad += `pixel_height = ${pixelHeight};\n`;
    scad += `image_width = ${image.width};\n`;
    scad += `image_height = ${image.height};\n\n`;
    
    // Create union of all color layers
    scad += 'union() {\n';
    
    image.partList.forEach((part, idx) => {
        const filename = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        const hex = colorEntryToHex(part.target);
        
        scad += `  // ${part.target.name} (${hex})\n`;
        scad += `  color("${hex}")\n`;
        scad += `  translate([0, 0, ${idx * pixelHeight}])\n`;
        scad += `  surface(file = "${filename}", center = false, invert = true);\n\n`;
    });
    
    scad += '}\n';
    
    return scad;
}

function addCube(
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number
): void {
    const baseIdx = vertices.length;
    
    // 8 vertices of a cube
    vertices.push(
        [x, y, z],           // 0
        [x + w, y, z],       // 1
        [x + w, y + h, z],   // 2
        [x, y + h, z],       // 3
        [x, y, z + d],       // 4
        [x + w, y, z + d],   // 5
        [x + w, y + h, z + d], // 6
        [x, y + h, z + d]    // 7
    );
    
    // 12 triangles (2 per face, 6 faces)
    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [2, 6, 7], [2, 7, 3], // back
        [0, 3, 7], [0, 7, 4], // left
        [1, 5, 6], [1, 6, 2]  // right
    ];
    
    faces.forEach(([v1, v2, v3]) => {
        triangles.push([baseIdx + v1, baseIdx + v2, baseIdx + v3]);
    });
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}
