import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export type ThreeDFormat = '3mf' | 'openscad-masks';

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
    filename: string;
}

/**
 * Generate and download a 3D file from the part list image
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF triangle mesh with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Build materials section
    let materials = '<basematerials id="1">\n';
    for (let i = 0; i < partList.length; i++) {
        const entry = partList[i];
        const rgb = `#${entry.target.r.toString(16).padStart(2, '0')}${entry.target.g.toString(16).padStart(2, '0')}${entry.target.b.toString(16).padStart(2, '0')}`;
        materials += `  <base name="${escapeXml(entry.target.name)}" displaycolor="${rgb}" />\n`;
    }
    materials += '</basematerials>';
    
    // Build mesh objects for each color
    let objects = '';
    let objectIndex = 2; // 1 is reserved for basematerials
    const buildItems: string[] = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a cube for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = baseHeight + pixelHeight;
                    
                    // 8 vertices of the cube
                    const baseVertex = vertexCount;
                    vertices.push(`    <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`    <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`    <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`    <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`    <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`    <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`    <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`    <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    vertexCount += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 1}" />`);
                    triangles.push(`    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 2}" />`);
                    // Top face
                    triangles.push(`    <triangle v1="${baseVertex + 4}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`);
                    triangles.push(`    <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`);
                    // Front face
                    triangles.push(`    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 5}" />`);
                    triangles.push(`    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 4}" />`);
                    // Back face
                    triangles.push(`    <triangle v1="${baseVertex + 2}" v2="${baseVertex + 3}" v3="${baseVertex + 7}" />`);
                    triangles.push(`    <triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`);
                    // Left face
                    triangles.push(`    <triangle v1="${baseVertex + 3}" v2="${baseVertex + 0}" v3="${baseVertex + 4}" />`);
                    triangles.push(`    <triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex + 7}" />`);
                    // Right face
                    triangles.push(`    <triangle v1="${baseVertex + 1}" v2="${baseVertex + 2}" v3="${baseVertex + 6}" />`);
                    triangles.push(`    <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`);
                }
            }
        }
        
        // Only create object if there are vertices
        if (vertices.length > 0) {
            objects += `<object id="${objectIndex}" type="model" pid="1" pindex="${colorIdx}">\n`;
            objects += '  <mesh>\n';
            objects += '  <vertices>\n';
            objects += vertices.join('\n') + '\n';
            objects += '  </vertices>\n';
            objects += '  <triangles>\n';
            objects += triangles.join('\n') + '\n';
            objects += '  </triangles>\n';
            objects += '  </mesh>\n';
            objects += '</object>\n';
            
            buildItems.push(`  <item objectid="${objectIndex}" />`);
            objectIndex++;
        }
    }
    
    // Construct the 3MF XML
    const model3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${materials}
    ${objects}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
    
    // Create a zip file with the 3MF structure
    const zip = new JSZip();
    zip.file('3D/3dmodel.model', model3mf);
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);
    
    const relsFolder = zip.folder('_rels');
    if (relsFolder) {
        relsFolder.file('.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`);
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}.3mf`);
}

/**
 * Generate OpenSCAD masks format: a zip file with one B&W image per color plus an SCAD file
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    const zip = new JSZip();
    const scadLines: string[] = [];
    
    scadLines.push('// OpenSCAD heightmap visualization');
    scadLines.push(`pixel_size = 1;`);
    scadLines.push(`pixel_height = ${pixelHeight};`);
    scadLines.push(`base_height = ${baseHeight};`);
    scadLines.push('');
    
    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const entry = partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Mark pixels with this color as black
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const filename = `mask_${colorIdx}_${sanitizeFilename(entry.target.name)}.png`;
        zip.file(filename, bytes);
        
        // Add SCAD code for this layer
        const r = entry.target.r / 255;
        const g = entry.target.g / 255;
        const b = entry.target.b / 255;
        scadLines.push(`// ${entry.target.name} (${entry.count} pixels)`);
        scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`  translate([0, 0, base_height])`);
        scadLines.push(`    scale([pixel_size, pixel_size, pixel_height])`);
        scadLines.push(`      surface(file = "${filename}", center = true, invert = true);`);
        scadLines.push('');
    }
    
    // Add the SCAD file
    zip.file('model.scad', scadLines.join('\n'));
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
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
    return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
