import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

/**
 * Export image as a 3MF triangle mesh with separate material shapes for each color
 */
export function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Export image as a ZIP file containing:
 * - One monochrome (black/white) image per color
 * - An OpenSCAD file that loads all images and combines them
 */
export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    // We'll need JSZip for this
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one black/white mask image per color
    const scadIncludes: Array<{ filename: string, color: any, colorIndex: number }> = [];
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImage = generateMaskImage(image, i);
        const maskFilename = `mask_${sanitizeFilename(part.target.name)}_${i}.png`;
        
        zip.file(maskFilename, maskImage);
        scadIncludes.push({
            filename: maskFilename,
            color: part.target,
            colorIndex: i
        });
    }

    // Generate the OpenSCAD file
    const scadContent = generateOpenSCADFile(scadIncludes, image.width, image.height);
    zip.file(`${filename}.scad`, scadContent);

    // Generate and download the ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${filename}_openscad.zip`);
}

function generate3MFContent(image: PartListImage): string {
    // 3MF file structure with multiple objects, one per color
    let objectsXml = '';
    let buildItemsXml = '';
    
    const baseHeight = 0;
    const pixelHeight = 1; // Height of each pixel/block
    const pixelSize = 1; // Size of each pixel in X/Y plane

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const objectId = colorIdx + 1;
        
        // Generate mesh for this color
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // For each pixel of this color, create a box
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;

                    // 8 vertices of the box
                    const v = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];

                    v.forEach(([vx, vy, vz]) => {
                        vertices.push(`<vertex x="${vx}" y="${vy}" z="${vz}" />`);
                    });

                    // 12 triangles (2 per face, 6 faces)
                    const base = vertexIndex;
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];

                    faces.forEach(([i1, i2, i3]) => {
                        triangles.push(`<triangle v1="${base + i1}" v2="${base + i2}" v3="${base + i3}" />`);
                    });

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            objectsXml += `
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;

            buildItemsXml += `    <item objectid="${objectId}" />\n`;
        }
    }

    // Generate full 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXml}
  </resources>
  <build>
${buildItemsXml}
  </build>
</model>`;

    return xml;
}

function generateMaskImage(image: PartListImage, colorIndex: number): Blob {
    // Create a canvas for the mask
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, image.width, image.height);

    // Draw black pixels where this color appears
    ctx.fillStyle = 'black';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // Convert to blob
    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    }) as any;
}

function generateOpenSCADFile(includes: Array<{ filename: string, color: any, colorIndex: number }>, width: number, height: number): string {
    let scad = `// Generated by firaga.io
// Image dimensions: ${width} x ${height}

// Parameters
pixel_size = 1; // Size of each pixel in mm
pixel_height = 1; // Height of each pixel layer in mm

// Union all color layers
union() {
`;

    includes.forEach(({ filename, color, colorIndex }) => {
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        scad += `    // Color: ${color.name}\n`;
        scad += `    color([${r}, ${g}, ${b}])\n`;
        scad += `    translate([0, 0, ${colorIndex * 0.01}]) // Slight offset to prevent z-fighting\n`;
        scad += `    surface(file = "${filename}", center = false, invert = true);\n`;
        scad += `\n`;
    });

    scad += `}
`;

    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Load JSZip dynamically
async function loadJSZip(): Promise<any> {
    if ((window as any).JSZip) {
        return (window as any).JSZip;
    }

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        document.head.appendChild(script);
    });
}
