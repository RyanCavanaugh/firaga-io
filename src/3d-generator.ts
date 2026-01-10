import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad-masks';

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    pixelWidth: number;
    baseHeight: number;
}

export function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    if (settings.format === '3mf') {
        generate3MF(image, settings, filename);
    } else {
        generateOpenSCADMasks(image, settings, filename);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    const { pixelWidth, pixelHeight, baseHeight } = settings;
    
    // Build 3MF XML structure
    let meshIndex = 1;
    const meshes: string[] = [];
    const objects: string[] = [];
    const resources: string[] = [];
    
    // Create material definitions
    const materials = image.partList.map((part, idx) => {
        const color = colorEntryToHex(part.target).replace('#', '');
        return `    <basematerials id="${idx + 1}">
      <base name="${part.target.name}" displaycolor="#${color}FF" />
    </basematerials>`;
    });
    
    // Generate mesh for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: number[] = [];
        let vertexCount = 0;
        
        // Collect all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = baseHeight;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexCount;
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
                    );
                    
                    // 12 triangles (2 per face, 6 faces)
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];
                    
                    faces.forEach(face => {
                        triangles.push(baseIdx + face[0], baseIdx + face[1], baseIdx + face[2]);
                    });
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            // Create mesh XML
            const verticesXml = vertices.map(v => 
                `        <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`
            ).join('\n');
            
            const trianglesXml: string[] = [];
            for (let i = 0; i < triangles.length; i += 3) {
                trianglesXml.push(`        <triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" pid="1" p1="0" />`);
            }
            
            meshes.push(`    <mesh>
      <vertices>
${verticesXml}
      </vertices>
      <triangles>
${trianglesXml.join('\n')}
      </triangles>
    </mesh>`);
            
            objects.push(`    <object id="${meshIndex + 1}" type="model" pid="${colorIdx + 1}" pindex="0">
      <mesh>
        <vertices>
${verticesXml}
        </vertices>
        <triangles>
${trianglesXml.join('\n')}
        </triangles>
      </mesh>
    </object>`);
            
            meshIndex++;
        }
    });
    
    // Build complete 3MF file structure
    const model3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n')}
  </build>
</model>`;
    
    // Create the 3MF package structure (simplified - proper 3MF requires ZIP with specific structure)
    const blob = new Blob([model3mf], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.model`);
}

function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string): void {
    const { pixelWidth, pixelHeight, baseHeight } = settings;
    
    // Create a canvas for each color mask
    const masks: Array<{ name: string; color: string; dataUrl: string }> = [];
    
    image.partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        masks.push({
            name: sanitizeFilename(part.target.name),
            color: colorEntryToHex(part.target),
            dataUrl: canvas.toDataURL('image/png')
        });
    });
    
    // Generate OpenSCAD file
    const scadFile = generateOpenSCADFile(masks, image, settings);
    
    // Create instructions for the user
    const instructions = `3D Model Generation Instructions
==================================

This archive contains:
1. ${masks.length} PNG mask files (one per color)
2. An OpenSCAD file (${filename}.scad)

To create your 3D model:
1. Extract all files to the same directory
2. Open ${filename}.scad in OpenSCAD (https://openscad.org/)
3. Press F5 to preview, F6 to render
4. Export as STL for 3D printing

Each color layer is ${pixelHeight}mm high.
Total height: ${baseHeight + pixelHeight}mm
`;
    
    // Note: Creating a proper ZIP file requires a library
    // For now, we'll save the SCAD file and provide instructions
    // A proper implementation would use JSZip or similar
    const scadBlob = new Blob([scadFile], { type: 'text/plain' });
    saveAs(scadBlob, `${filename}.scad`);
    
    // Save each mask
    masks.forEach((mask, idx) => {
        const maskFilename = `${filename}_${idx}_${mask.name}.png`;
        fetch(mask.dataUrl)
            .then(res => res.blob())
            .then(blob => {
                saveAs(blob, maskFilename);
            });
    });
    
    // Save instructions
    const instructionsBlob = new Blob([instructions], { type: 'text/plain' });
    saveAs(instructionsBlob, `${filename}_README.txt`);
}

function generateOpenSCADFile(
    masks: Array<{ name: string; color: string; dataUrl: string }>,
    image: PartListImage,
    settings: ThreeDSettings
): string {
    const { pixelWidth, pixelHeight, baseHeight } = settings;
    
    const layers = masks.map((mask, idx) => {
        const colorHex = mask.color.replace('#', '');
        const r = parseInt(colorHex.substr(0, 2), 16) / 255;
        const g = parseInt(colorHex.substr(2, 2), 16) / 255;
        const b = parseInt(colorHex.substr(4, 2), 16) / 255;
        
        const filename = `${idx}_${mask.name}.png`;
        
        return `// Layer ${idx + 1}: ${image.partList[idx].target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${baseHeight + idx * pixelHeight}])
surface(file = "${filename}", 
        center = false, 
        invert = true);`;
    });
    
    return `// Generated by firaga.io
// 3D pixel art model

pixel_width = ${pixelWidth};
pixel_height = ${pixelHeight};
base_height = ${baseHeight};
image_width = ${image.width};
image_height = ${image.height};

scale([pixel_width, pixel_height, pixel_height]) {
${layers.join('\n\n')}
}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}
