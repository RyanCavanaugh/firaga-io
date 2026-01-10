import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export function export3MF(image: PartListImage, filename: string): void {
    const xml = generate3MF(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename.replace('.png', '')}.3mf`);
}

function generate3MF(image: PartListImage): string {
    const height = 2; // Height of each bead in mm
    const width = 5; // Width/depth of each bead in mm
    
    // Group pixels by color
    const colorGroups = new Map<number, { x: number, y: number }[]>();
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIndex = image.pixels[y][x];
            if (colorIndex !== undefined) {
                if (!colorGroups.has(colorIndex)) {
                    colorGroups.set(colorIndex, []);
                }
                colorGroups.get(colorIndex)!.push({ x, y });
            }
        }
    }

    let objectId = 1;
    const resources: string[] = [];
    const components: string[] = [];

    // Create a mesh for each color
    colorGroups.forEach((positions, colorIndex) => {
        const color = image.partList[colorIndex];
        if (!color) return;

        const meshData = generateMeshForColor(positions, width, height);
        const colorHex = colorEntryToHex(color.target).slice(1); // Remove #
        
        resources.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${meshData.vertices}
        </vertices>
        <triangles>
${meshData.triangles}
        </triangles>
      </mesh>
    </object>`);

        components.push(`      <component objectid="${objectId}" />`);
        objectId++;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
    <object id="${objectId}" type="model">
      <components>
${components.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${objectId}" />
  </build>
</model>`;
}

function generateMeshForColor(positions: { x: number, y: number }[], beadSize: number, beadHeight: number): { vertices: string, triangles: string } {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexIndex = 0;

    positions.forEach(pos => {
        const x0 = pos.x * beadSize;
        const y0 = pos.y * beadSize;
        const x1 = x0 + beadSize;
        const y1 = y0 + beadSize;

        // Create a simple box for each bead
        // 8 vertices per box
        const v = [
            `          <vertex x="${x0}" y="${y0}" z="0" />`,
            `          <vertex x="${x1}" y="${y0}" z="0" />`,
            `          <vertex x="${x1}" y="${y1}" z="0" />`,
            `          <vertex x="${x0}" y="${y1}" z="0" />`,
            `          <vertex x="${x0}" y="${y0}" z="${beadHeight}" />`,
            `          <vertex x="${x1}" y="${y0}" z="${beadHeight}" />`,
            `          <vertex x="${x1}" y="${y1}" z="${beadHeight}" />`,
            `          <vertex x="${x0}" y="${y1}" z="${beadHeight}" />`
        ];
        vertices.push(...v);

        const base = vertexIndex;
        // 12 triangles per box (2 per face, 6 faces)
        const t = [
            // Bottom face
            `          <triangle v1="${base}" v2="${base + 2}" v3="${base + 1}" />`,
            `          <triangle v1="${base}" v2="${base + 3}" v3="${base + 2}" />`,
            // Top face
            `          <triangle v1="${base + 4}" v2="${base + 5}" v3="${base + 6}" />`,
            `          <triangle v1="${base + 4}" v2="${base + 6}" v3="${base + 7}" />`,
            // Front face
            `          <triangle v1="${base}" v2="${base + 1}" v3="${base + 5}" />`,
            `          <triangle v1="${base}" v2="${base + 5}" v3="${base + 4}" />`,
            // Right face
            `          <triangle v1="${base + 1}" v2="${base + 2}" v3="${base + 6}" />`,
            `          <triangle v1="${base + 1}" v2="${base + 6}" v3="${base + 5}" />`,
            // Back face
            `          <triangle v1="${base + 2}" v2="${base + 3}" v3="${base + 7}" />`,
            `          <triangle v1="${base + 2}" v2="${base + 7}" v3="${base + 6}" />`,
            // Left face
            `          <triangle v1="${base + 3}" v2="${base}" v3="${base + 4}" />`,
            `          <triangle v1="${base + 3}" v2="${base + 4}" v3="${base + 7}" />`
        ];
        triangles.push(...t);

        vertexIndex += 8;
    });

    return {
        vertices: vertices.join('\n'),
        triangles: triangles.join('\n')
    };
}

export async function exportOpenSCADMasks(image: PartListImage, filename: string): Promise<void> {
    const zipBlob = await createOpenSCADMasksZip(image, filename);
    saveAs(zipBlob, `${filename.replace('.png', '')}-openscad.zip`);
}

async function createOpenSCADMasksZip(image: PartListImage, filename: string): Promise<Blob> {
    const zip = new JSZip();
    
    // Generate one PNG per color
    const imagePromises: Promise<void>[] = [];
    
    for (let index = 0; index < image.partList.length; index++) {
        const part = image.partList[index];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === index) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const pngName = `color_${index}_${safeName}.png`;
        
        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    zip.file(pngName, blob);
                }
                resolve();
            });
        });
        
        imagePromises.push(promise);
    }
    
    // Wait for all images to be converted
    await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    let scadContent = `// Generated OpenSCAD file for ${filename}
// Image dimensions: ${image.width} x ${image.height}

pixel_size = 5; // Size of each pixel in mm
height = 2; // Height in mm

`;

    image.partList.forEach((part, index) => {
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const colorHex = colorEntryToHex(part.target);
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;
        
        scadContent += `// ${part.target.name} (${part.target.code || 'no code'})
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([pixel_size, pixel_size, height])
    surface(file = "color_${index}_${safeName}.png", center = true, invert = true);

`;
    });

    zip.file(`${filename.replace('.png', '')}.scad`, scadContent);
    
    // Create a README file with instructions
    const readmeContent = `OpenSCAD 3D Export
==================

This ZIP file contains:
- ${filename.replace('.png', '')}.scad - OpenSCAD file
- color_*.png - Monochrome mask images for each color

Usage Instructions:
1. Extract all files to the same directory
2. Open the .scad file in OpenSCAD (https://openscad.org/)
3. Press F5 to preview or F6 to render the 3D model
4. Export as STL for 3D printing if desired

Image Information:
- Dimensions: ${image.width} x ${image.height} pixels
- Colors: ${image.partList.length}
- Each pixel becomes a 5mm x 5mm x 2mm voxel in the 3D model

Note: The heightmap-based rendering uses surface() to create 3D geometry
from the black/white mask images. Black pixels create raised geometry.
`;

    zip.file('README.txt', readmeContent);
    
    // Generate the ZIP file
    return await zip.generateAsync({ type: 'blob' });
}
