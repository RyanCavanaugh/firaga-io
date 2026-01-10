import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base in mm
}

export async function export3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings) {
    // Create 3MF file - a 3D manufacturing format based on XML
    const models: string[] = [];
    
    // Generate mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build heightmap mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Add a box for this pixel
                    addPixelBox(vertices, triangles, x, y, settings.pixelHeight + settings.baseHeight);
                }
            }
        }
        
        if (vertices.length > 0) {
            models.push(generateMeshXML(colorIndex + 1, vertices, triangles, part.target));
        }
    }
    
    // Add base plate
    const baseVertices: Array<[number, number, number]> = [];
    const baseTriangles: Array<[number, number, number]> = [];
    addPixelBox(baseVertices, baseTriangles, 0, 0, settings.baseHeight, image.width, image.height);
    models.push(generateMeshXML(0, baseVertices, baseTriangles, { r: 128, g: 128, b: 128, name: "Base" }));
    
    const xml = generate3MF(models);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, settings.filename + ".3mf");
}

function addPixelBox(
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    x: number,
    y: number,
    height: number,
    width: number = 1,
    depth: number = 1
) {
    const baseIndex = vertices.length;
    
    // Add 8 vertices for a box (each pixel is 1mm x 1mm by default)
    const x0 = x, x1 = x + width;
    const y0 = y, y1 = y + depth;
    const z0 = 0, z1 = height;
    
    vertices.push(
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
    );
    
    // Add 12 triangles (2 per face, 6 faces)
    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0]  // left
    ];
    
    for (const face of faces) {
        triangles.push([
            baseIndex + face[0],
            baseIndex + face[1],
            baseIndex + face[2]
        ]);
    }
}

function generateMeshXML(
    objectId: number,
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number]>,
    color: { r: number, g: number, b: number, name: string }
): string {
    const verticesXML = vertices.map(v => 
        `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`
    ).join('\n');
    
    const trianglesXML = triangles.map(t => 
        `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`
    ).join('\n');
    
    return `  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
${verticesXML}
      </vertices>
      <triangles>
${trianglesXML}
      </triangles>
    </mesh>
  </object>`;
}

function generate3MF(models: string[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${models.join('\n')}
  </resources>
  <build>
${models.map((_, i) => `    <item objectid="${i}" />`).join('\n')}
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = await import('jszip').then(m => m.default);
    const zip = new JSZip();
    
    // Create one PNG mask per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
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
        
        // Convert to blob and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`color_${colorIndex}_${safeName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, settings.filename + '_openscad.zip');
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const lines: string[] = [];
    
    lines.push('// Generated 3D model from firaga.io');
    lines.push(`// Image size: ${image.width}x${image.height}`);
    lines.push('');
    lines.push(`pixel_height = ${settings.pixelHeight};`);
    lines.push(`base_height = ${settings.baseHeight};`);
    lines.push(`image_width = ${image.width};`);
    lines.push(`image_height = ${image.height};`);
    lines.push('');
    
    // Add base plate
    lines.push('// Base plate');
    lines.push('color([0.5, 0.5, 0.5])');
    lines.push(`cube([image_width, image_height, base_height]);`);
    lines.push('');
    
    // Add each color layer
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        lines.push(`// ${part.target.name}`);
        lines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        lines.push('translate([0, 0, base_height])');
        lines.push(`scale([1, 1, pixel_height])`);
        lines.push(`surface(file = "color_${colorIndex}_${safeName}.png", center = false, invert = true);`);
        lines.push('');
    }
    
    return lines.join('\n');
}
