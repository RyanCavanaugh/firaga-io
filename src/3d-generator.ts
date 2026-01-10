import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DFormat = '3mf' | 'openscad';

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    pitch: number; // mm per pixel
    height: number; // mm height of each layer
}

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const zip = new JSZip();
    
    // Add required 3MF files
    zip.file('[Content_Types].xml', generateContentTypesXML());
    
    const relsFolder = zip.folder('_rels');
    if (relsFolder) {
        relsFolder.file('.rels', generateRelsXML());
    }
    
    const modelFolder = zip.folder('3D');
    if (modelFolder) {
        modelFolder.file('3dmodel.model', generate3DModelXML(image, settings));
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const zip = new JSZip();
    
    // Generate one PNG per color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const pngData = generateColorMask(image, i);
        zip.file(`mask_${part.symbol}_${part.target.code || i}.png`, pngData, { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function generateContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3DModelXML(image: PartListImage, settings: Export3DSettings): string {
    const { pitch, height } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `\n      <base name="${color.name}" displaycolor="#${hexColor}"/>`;
    });
    
    xml += `\n    </basematerials>`;
    
    // Generate mesh objects for each color
    image.partList.forEach((part, colorIndex) => {
        const meshData = generateMeshForColor(image, colorIndex, pitch, height);
        if (meshData.vertices.length > 0) {
            xml += `\n    <object id="${colorIndex + 2}" type="model">
      <mesh>
        <vertices>`;
            
            meshData.vertices.forEach(v => {
                xml += `\n          <vertex x="${v.x}" y="${v.y}" z="${v.z}"/>`;
            });
            
            xml += `\n        </vertices>
        <triangles>`;
            
            meshData.triangles.forEach(t => {
                xml += `\n          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${colorIndex}"/>`;
            });
            
            xml += `\n        </triangles>
      </mesh>
    </object>`;
        }
    });
    
    xml += `\n  </resources>
  <build>`;
    
    // Add build items for each non-empty mesh
    image.partList.forEach((part, colorIndex) => {
        xml += `\n    <item objectid="${colorIndex + 2}"/>`;
    });
    
    xml += `\n  </build>
</model>`;
    
    return xml;
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

interface MeshData {
    vertices: Vertex[];
    triangles: Triangle[];
}

function generateMeshForColor(image: PartListImage, colorIndex: number, pitch: number, height: number): MeshData {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    
    // For each pixel of this color, create a box (12 triangles, 8 vertices)
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                const baseIdx = vertices.length;
                const x0 = x * pitch;
                const x1 = (x + 1) * pitch;
                const y0 = y * pitch;
                const y1 = (y + 1) * pitch;
                const z0 = 0;
                const z1 = height;
                
                // Add 8 vertices for a box
                vertices.push(
                    { x: x0, y: y0, z: z0 }, // 0
                    { x: x1, y: y0, z: z0 }, // 1
                    { x: x1, y: y1, z: z0 }, // 2
                    { x: x0, y: y1, z: z0 }, // 3
                    { x: x0, y: y0, z: z1 }, // 4
                    { x: x1, y: y0, z: z1 }, // 5
                    { x: x1, y: y1, z: z1 }, // 6
                    { x: x0, y: y1, z: z1 }  // 7
                );
                
                // Add 12 triangles (2 per face, 6 faces)
                // Bottom face (z=0)
                triangles.push(
                    { v1: baseIdx + 0, v2: baseIdx + 2, v3: baseIdx + 1 },
                    { v1: baseIdx + 0, v2: baseIdx + 3, v3: baseIdx + 2 }
                );
                // Top face (z=height)
                triangles.push(
                    { v1: baseIdx + 4, v2: baseIdx + 5, v3: baseIdx + 6 },
                    { v1: baseIdx + 4, v2: baseIdx + 6, v3: baseIdx + 7 }
                );
                // Front face (y=y0)
                triangles.push(
                    { v1: baseIdx + 0, v2: baseIdx + 1, v3: baseIdx + 5 },
                    { v1: baseIdx + 0, v2: baseIdx + 5, v3: baseIdx + 4 }
                );
                // Back face (y=y1)
                triangles.push(
                    { v1: baseIdx + 3, v2: baseIdx + 6, v3: baseIdx + 2 },
                    { v1: baseIdx + 3, v2: baseIdx + 7, v3: baseIdx + 6 }
                );
                // Left face (x=x0)
                triangles.push(
                    { v1: baseIdx + 0, v2: baseIdx + 4, v3: baseIdx + 7 },
                    { v1: baseIdx + 0, v2: baseIdx + 7, v3: baseIdx + 3 }
                );
                // Right face (x=x1)
                triangles.push(
                    { v1: baseIdx + 1, v2: baseIdx + 2, v3: baseIdx + 6 },
                    { v1: baseIdx + 1, v2: baseIdx + 6, v3: baseIdx + 5 }
                );
            }
        }
    }
    
    return { vertices, triangles };
}

function generateColorMask(image: PartListImage, colorIndex: number): string {
    // Create a canvas with black pixels where this color exists
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, image.width, image.height);
    
    // Draw black pixels where this color exists
    ctx.fillStyle = 'black';
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    // Convert to base64 PNG
    const dataURL = canvas.toDataURL('image/png');
    return dataURL.split(',')[1]; // Remove data:image/png;base64, prefix
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { pitch, height } = settings;
    let scad = `// Generated by firaga.io
// Pixel pitch: ${pitch}mm
// Layer height: ${height}mm

`;
    
    // Generate module for each color
    image.partList.forEach((part, idx) => {
        const filename = `mask_${part.symbol}_${part.target.code || idx}.png`;
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scad += `module color_${idx}() {
  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  surface(file = "${filename}", center = true, invert = true);
}

`;
    });
    
    // Generate combined model
    scad += `// Combined model
scale([${pitch}, ${pitch}, ${height}]) {
`;
    
    image.partList.forEach((part, idx) => {
        scad += `  translate([${image.width / 2}, ${image.height / 2}, ${idx}])
    color_${idx}();
`;
    });
    
    scad += `}
`;
    
    return scad;
}
