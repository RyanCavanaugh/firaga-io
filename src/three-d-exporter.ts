import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad-masks';

export interface ThreeDExportSettings {
    format: ThreeDFormat;
    filename: string;
    height: number; // Height in mm for the 3D extrusion
}

/**
 * Export a PartListImage as a 3D file
 */
export async function export3D(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else {
        await exportOpenSCADMasks(image, settings);
    }
}

/**
 * Export as 3MF format with separate material shapes for each color
 */
async function export3MF(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const zip = new JSZip();
    
    // Add required _rels/.rels file
    const relsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.folder('_rels')!.file('.rels', relsContent);
    
    // Add [Content_Types].xml
    const contentTypesContent = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file('[Content_Types].xml', contentTypesContent);
    
    // Generate 3D model
    const modelContent = generate3MFModel(image, settings.height);
    zip.folder('3D')!.file('3dmodel.model', modelContent);
    
    // Generate and save zip
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}.3mf`);
}

/**
 * Generate the 3D model XML content for 3MF
 */
function generate3MFModel(image: PartListImage, heightMm: number): string {
    const voxelSize = 1.0; // 1mm per pixel
    const parts: string[] = [];
    const materialIds: number[] = [];
    
    // Create separate mesh for each color
    image.partList.forEach((part, partIndex) => {
        const { vertices, triangles } = generateMeshForColor(image, partIndex, voxelSize, heightMm);
        
        if (triangles.length === 0) return;
        
        const objectId = parts.length + 1;
        const materialId = 1000 + partIndex;
        materialIds.push(materialId);
        
        parts.push(`  <object id="${objectId}" type="model" pid="${materialId}" pindex="0">
    <mesh>
      <vertices>
${vertices.map((v, i) => `        <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}" />`).join('\n')}
      </vertices>
      <triangles>
${triangles.map(t => `        <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n')}
      </triangles>
    </mesh>
  </object>`);
    });
    
    // Build list - includes all objects
    const buildItems = parts
        .map((_, i) => `    <item objectid="${i + 1}" />`)
        .join('\n');
    
    // Color/material resources
    const materials = image.partList
        .map((part, i) => {
            const color = rgbToSRGB(part.target.r, part.target.g, part.target.b);
            const materialId = 1000 + i;
            return `    <basematerials id="${materialId}">
      <base name="${part.target.name}" displaycolor="${color}" />
    </basematerials>`;
        })
        .join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
${materials}
${parts.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

interface Vertex {
    x: number;
    y: number;
    z: number;
}

interface Triangle {
    v1: number;
    v2: number;
    v3: number;
}

/**
 * Generate mesh geometry for pixels of a specific color
 */
function generateMeshForColor(
    image: PartListImage,
    colorIndex: number,
    voxelSize: number,
    height: number
): { vertices: Vertex[]; triangles: Triangle[] } {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    const vertexMap = new Map<string, number>();
    
    const getOrCreateVertex = (x: number, y: number, z: number): number => {
        const key = `${x},${y},${z}`;
        const existing = vertexMap.get(key);
        if (existing !== undefined) return existing;
        
        const index = vertices.length;
        vertices.push({ x, y, z });
        vertexMap.set(key, index);
        return index;
    };
    
    // For each pixel with this color, create a voxel (cube)
    for (let py = 0; py < image.height; py++) {
        for (let px = 0; px < image.width; px++) {
            if (image.pixels[py][px] !== colorIndex) continue;
            
            const x0 = px * voxelSize;
            const x1 = (px + 1) * voxelSize;
            const y0 = py * voxelSize;
            const y1 = (py + 1) * voxelSize;
            const z0 = 0;
            const z1 = height;
            
            // Create cube with 12 triangles (2 per face)
            // Bottom face (z=0)
            const v0 = getOrCreateVertex(x0, y0, z0);
            const v1 = getOrCreateVertex(x1, y0, z0);
            const v2 = getOrCreateVertex(x1, y1, z0);
            const v3 = getOrCreateVertex(x0, y1, z0);
            
            // Top face (z=height)
            const v4 = getOrCreateVertex(x0, y0, z1);
            const v5 = getOrCreateVertex(x1, y0, z1);
            const v6 = getOrCreateVertex(x1, y1, z1);
            const v7 = getOrCreateVertex(x0, y1, z1);
            
            // Bottom face
            triangles.push({ v1: v0, v2: v2, v3: v1 });
            triangles.push({ v1: v0, v2: v3, v3: v2 });
            
            // Top face
            triangles.push({ v1: v4, v2: v5, v3: v6 });
            triangles.push({ v1: v4, v2: v6, v3: v7 });
            
            // Front face (y=y0)
            triangles.push({ v1: v0, v2: v1, v3: v5 });
            triangles.push({ v1: v0, v2: v5, v3: v4 });
            
            // Back face (y=y1)
            triangles.push({ v1: v2, v2: v3, v3: v7 });
            triangles.push({ v1: v2, v2: v7, v3: v6 });
            
            // Left face (x=x0)
            triangles.push({ v1: v3, v2: v0, v3: v4 });
            triangles.push({ v1: v3, v2: v4, v3: v7 });
            
            // Right face (x=x1)
            triangles.push({ v1: v1, v2: v2, v3: v6 });
            triangles.push({ v1: v1, v2: v6, v3: v5 });
        }
    }
    
    return { vertices, triangles };
}

/**
 * Export as OpenSCAD masks format - zip with monochrome images and .scad file
 */
async function exportOpenSCADMasks(image: PartListImage, settings: ThreeDExportSettings): Promise<void> {
    const zip = new JSZip();
    
    // Create one black/white image per color
    const imagePromises = image.partList.map(async (part, partIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        return new Promise<{ filename: string; blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
                resolve({ filename, blob: blob! });
            });
        });
    });
    
    const images = await Promise.all(imagePromises);
    
    // Add images to zip
    images.forEach(({ filename, blob }) => {
        zip.file(filename, blob);
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings.height);
    zip.file('model.scad', scadContent);
    
    // Add README
    const readme = `OpenSCAD Heightmap Model
========================

This archive contains:
- One PNG heightmap per color (black = present, white = absent)
- model.scad - OpenSCAD script to combine all layers

To use:
1. Open model.scad in OpenSCAD
2. Render (F6) to generate the 3D model
3. Export as STL or other format

Each color layer is extruded to the specified height and colored accordingly.
`;
    zip.file('README.txt', readme);
    
    // Generate and save zip
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

/**
 * Generate OpenSCAD script that loads heightmaps and combines them
 */
function generateOpenSCADFile(image: PartListImage, heightMm: number): string {
    const voxelSize = 1.0; // 1mm per pixel
    
    const layers = image.partList.map((part, i) => {
        const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
        const color = rgbToOpenSCAD(part.target.r, part.target.g, part.target.b);
        
        return `// Layer ${i + 1}: ${part.target.name}
color(${color})
  surface(file = "${filename}", center = true, convexity = 5);`;
    }).join('\n\n');
    
    return `// Generated OpenSCAD model from firaga.io
// Image size: ${image.width}x${image.height} pixels
// Height: ${heightMm}mm

$fn = 20; // Circle resolution

// Scale factor: 1 pixel = ${voxelSize}mm, height scale = ${heightMm}/255
scale([${voxelSize}, ${voxelSize}, ${heightMm / 255}])
union() {
${layers.split('\n').map(line => '  ' + line).join('\n')}
}
`;
}

/**
 * Convert RGB to sRGB hex color for 3MF
 */
function rgbToSRGB(r: number, g: number, b: number): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to OpenSCAD color array
 */
function rgbToOpenSCAD(r: number, g: number, b: number): string {
    return `[${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}]`;
}

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
