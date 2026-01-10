import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';

export function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MFContent(image: PartListImage): string {
    const height = 2.0; // Base height in mm
    const pixelSize = 1.0; // Each pixel is 1mm x 1mm
    
    let vertexId = 1;
    let triangleId = 1;
    const objects: string[] = [];
    const resources: string[] = [];
    
    // Create a separate object for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        const vertexMap = new Map<string, number>();
        
        function getOrCreateVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            if (!vertexMap.has(key)) {
                const id = vertexId++;
                vertices.push(`<vertex x="${x}" y="${y}" z="${z}"/>`);
                vertexMap.set(key, id - 1);
            }
            return vertexMap.get(key)!;
        }
        
        // Find all pixels of this color and create geometry
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    
                    // Bottom vertices
                    const v0 = getOrCreateVertex(x0, y0, 0);
                    const v1 = getOrCreateVertex(x1, y0, 0);
                    const v2 = getOrCreateVertex(x1, y1, 0);
                    const v3 = getOrCreateVertex(x0, y1, 0);
                    
                    // Top vertices
                    const v4 = getOrCreateVertex(x0, y0, height);
                    const v5 = getOrCreateVertex(x1, y0, height);
                    const v6 = getOrCreateVertex(x1, y1, height);
                    const v7 = getOrCreateVertex(x0, y1, height);
                    
                    // Bottom face (2 triangles)
                    triangles.push(`<triangle v1="${v0}" v2="${v2}" v3="${v1}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v3}" v3="${v2}"/>`);
                    
                    // Top face (2 triangles)
                    triangles.push(`<triangle v1="${v4}" v2="${v5}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v4}" v2="${v6}" v3="${v7}"/>`);
                    
                    // Side faces (8 triangles)
                    // Front
                    triangles.push(`<triangle v1="${v0}" v2="${v1}" v3="${v5}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v5}" v3="${v4}"/>`);
                    // Right
                    triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v1}" v2="${v6}" v3="${v5}"/>`);
                    // Back
                    triangles.push(`<triangle v1="${v2}" v2="${v3}" v3="${v7}"/>`);
                    triangles.push(`<triangle v1="${v2}" v2="${v7}" v3="${v6}"/>`);
                    // Left
                    triangles.push(`<triangle v1="${v3}" v2="${v0}" v3="${v4}"/>`);
                    triangles.push(`<triangle v1="${v3}" v2="${v4}" v3="${v7}"/>`);
                }
            }
        }
        
        if (vertices.length > 0) {
            const objectId = colorIndex + 1;
            const r = part.target.r / 255;
            const g = part.target.g / 255;
            const b = part.target.b / 255;
            
            resources.push(`<basematerials id="material_${objectId}">
    <base name="${part.target.name}" displaycolor="#${componentToHex(part.target.r)}${componentToHex(part.target.g)}${componentToHex(part.target.b)}"/>
  </basematerials>`);
            
            objects.push(`<object id="${objectId}" type="model" pid="material_${objectId}" pindex="0">
    <mesh>
      <vertices>
        ${vertices.join('\n        ')}
      </vertices>
      <triangles>
        ${triangles.join('\n        ')}
      </triangles>
    </mesh>
  </object>`);
        }
    });
    
    const buildItems = objects.map((_, idx) => 
        `<item objectid="${idx + 1}"/>`
    ).join('\n    ');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${resources.join('\n    ')}
    ${objects.join('\n    ')}
  </resources>
  <build>
    ${buildItems}
  </build>
</model>`;
}

function componentToHex(c: number): string {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const scadLines: string[] = [];
    scadLines.push('// OpenSCAD file generated for pixel art display');
    scadLines.push('// Each color is represented as a separate heightmap layer\n');
    
    const pixelSize = 1.0; // mm per pixel
    const layerHeight = 2.0; // mm height per layer
    
    // Generate a mask image for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext('2d')!;
        
        // Fill with white (no extrusion)
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
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            maskCanvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeColorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const imageName = `mask_${colorIndex}_${safeColorName}.png`;
        zip.file(imageName, blob);
        
        // Add to SCAD file
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadLines.push(`// ${part.target.name} (${part.count} pixels)`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  translate([0, 0, ${colorIndex * layerHeight}])`);
        scadLines.push(`    surface(file="${imageName}", center=true, invert=true);`);
        scadLines.push('');
    }
    
    zip.file(`${filename}.scad`, scadLines.join('\n'));
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}
