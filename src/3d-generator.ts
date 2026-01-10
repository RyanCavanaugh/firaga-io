import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export type ThreeDFormat = '3mf' | 'openscad';

export type ThreeDSettings = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
};

/**
 * Generate and download a 3D file from the image
 */
export function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    if (settings.format === '3mf') {
        generate3MF(image, settings, filename);
    } else {
        generateOpenSCAD(image, settings, filename);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseHeight } = settings;

    let objectId = 1;
    const objects: string[] = [];
    const items: string[] = [];

    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexId = 0;

        // Find all pixels of this color and create cubes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a cube at position (x, y) with height pixelHeight
                    const baseVertexId = vertexId;
                    
                    // Bottom vertices (z = 0)
                    vertices.push(`<vertex x="${x}" y="${y}" z="0" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="0" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="0" />`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="0" />`);
                    
                    // Top vertices (z = pixelHeight)
                    vertices.push(`<vertex x="${x}" y="${y}" z="${pixelHeight}" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y}" z="${pixelHeight}" />`);
                    vertices.push(`<vertex x="${x + 1}" y="${y + 1}" z="${pixelHeight}" />`);
                    vertices.push(`<vertex x="${x}" y="${y + 1}" z="${pixelHeight}" />`);
                    
                    // Bottom face
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 2}" v3="${baseVertexId + 1}" />`);
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 3}" v3="${baseVertexId + 2}" />`);
                    
                    // Top face
                    triangles.push(`<triangle v1="${baseVertexId + 4}" v2="${baseVertexId + 5}" v3="${baseVertexId + 6}" />`);
                    triangles.push(`<triangle v1="${baseVertexId + 4}" v2="${baseVertexId + 6}" v3="${baseVertexId + 7}" />`);
                    
                    // Front face
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 1}" v3="${baseVertexId + 5}" />`);
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 5}" v3="${baseVertexId + 4}" />`);
                    
                    // Back face
                    triangles.push(`<triangle v1="${baseVertexId + 3}" v2="${baseVertexId + 7}" v3="${baseVertexId + 6}" />`);
                    triangles.push(`<triangle v1="${baseVertexId + 3}" v2="${baseVertexId + 6}" v3="${baseVertexId + 2}" />`);
                    
                    // Left face
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 4}" v3="${baseVertexId + 7}" />`);
                    triangles.push(`<triangle v1="${baseVertexId + 0}" v2="${baseVertexId + 7}" v3="${baseVertexId + 3}" />`);
                    
                    // Right face
                    triangles.push(`<triangle v1="${baseVertexId + 1}" v2="${baseVertexId + 2}" v3="${baseVertexId + 6}" />`);
                    triangles.push(`<triangle v1="${baseVertexId + 1}" v2="${baseVertexId + 6}" v3="${baseVertexId + 5}" />`);
                    
                    vertexId += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const { r, g, b } = part.target;
            const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            
            objects.push(`
  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
        ${vertices.join('\n        ')}
      </vertices>
      <triangles>
        ${triangles.join('\n        ')}
      </triangles>
    </mesh>
  </object>`);
            
            items.push(`    <item objectid="${objectId}" />`);
            objectId++;
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

/**
 * Generate OpenSCAD masks format (zip with images + .scad file)
 */
async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelHeight } = settings;

    // Note: This implementation requires JSZip to be loaded globally
    // For now, we'll generate the files separately and alert the user
    
    // Create the OpenSCAD file content
    const scadLines: string[] = [
        '// Generated OpenSCAD file for 3D pixel art',
        `// Image size: ${width}x${height}`,
        `// Save heightmap PNGs in the same directory as this file`,
        '',
        'pixel_size = 1; // Size of each pixel in mm',
        `pixel_height = ${pixelHeight}; // Height multiplier for each colored pixel`,
        '',
        'union() {',
    ];

    // Track all files that need to be created
    const imagesToCreate: Array<{ name: string; color: { r: number; g: number; b: number }; data: ImageData }> = [];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const part = partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(width, height);

        // Create monochrome heightmap: white = height, black = no height
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const isColor = pixels[y][x] === colorIdx;
                const value = isColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }

        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const pngFilename = `color_${colorIdx}_${sanitizedName}.png`;
        
        imagesToCreate.push({
            name: pngFilename,
            color: { r: part.target.r, g: part.target.g, b: part.target.b },
            data: imageData
        });

        const { r, g, b } = part.target;
        scadLines.push(`  // ${part.target.name}`);
        scadLines.push(`  color([${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}])`);
        scadLines.push(`    scale([pixel_size, pixel_size, pixel_height])`);
        scadLines.push(`      surface(file = "${pngFilename}", center = false, invert = true);`);
        scadLines.push('');
    }

    scadLines.push('}');

    const scadContent = scadLines.join('\n');
    
    // Save the .scad file
    const scadBlob = new Blob([scadContent], { type: 'text/plain;charset=utf-8' });
    saveAs(scadBlob, `${filename}.scad`);

    // Download each heightmap image
    for (const img of imagesToCreate) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(img.data, 0, 0);
        
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        saveAs(blob, img.name);
    }

    alert(`Generated ${imagesToCreate.length + 1} files for OpenSCAD. Save all files in the same directory.`);
}
