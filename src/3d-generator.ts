import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const xml = build3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadFile(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Build materials section
    let materialsXML = '';
    partList.forEach((part, index) => {
        const hexColor = colorEntryToHex(part.target).substring(1); // Remove '#'
        materialsXML += `    <basematerials id="${index + 1}">
      <base name="${escapeXML(part.target.name)}" displaycolor="#${hexColor}" />
    </basematerials>\n`;
    });
    
    // Build objects section - one object per color
    let objectsXML = '';
    let objectId = 1;
    
    partList.forEach((part, partIndex) => {
        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
        
        // For each pixel of this color, create a voxel (box)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    addVoxel(vertices, triangles, x, y, baseHeight, pixelHeight);
                }
            }
        }
        
        if (vertices.length > 0) {
            objectsXML += `    <object id="${objectId}" type="model" materialid="${partIndex + 1}">\n`;
            objectsXML += '      <mesh>\n';
            objectsXML += '        <vertices>\n';
            vertices.forEach(v => {
                objectsXML += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
            });
            objectsXML += '        </vertices>\n';
            objectsXML += '        <triangles>\n';
            triangles.forEach(t => {
                objectsXML += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
            });
            objectsXML += '        </triangles>\n';
            objectsXML += '      </mesh>\n';
            objectsXML += '    </object>\n';
            objectId++;
        }
    });
    
    // Build the complete 3MF XML structure
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materialsXML}${objectsXML}    <build>
${Array.from({ length: objectId - 1 }, (_, i) => `      <item objectid="${i + 1}" />`).join('\n')}
    </build>
  </resources>
</model>`;
    
    return xml;
}

function addVoxel(
    vertices: Array<{ x: number; y: number; z: number }>,
    triangles: Array<{ v1: number; v2: number; v3: number }>,
    x: number,
    y: number,
    baseZ: number,
    height: number
): void {
    const baseIndex = vertices.length;
    
    // Define the 8 vertices of a box
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = baseZ;
    const z1 = baseZ + height;
    
    // Add 8 vertices
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
    // Bottom face (z0)
    triangles.push(
        { v1: baseIndex + 0, v2: baseIndex + 1, v3: baseIndex + 2 },
        { v1: baseIndex + 0, v2: baseIndex + 2, v3: baseIndex + 3 }
    );
    // Top face (z1)
    triangles.push(
        { v1: baseIndex + 4, v2: baseIndex + 6, v3: baseIndex + 5 },
        { v1: baseIndex + 4, v2: baseIndex + 7, v3: baseIndex + 6 }
    );
    // Front face (y0)
    triangles.push(
        { v1: baseIndex + 0, v2: baseIndex + 4, v3: baseIndex + 5 },
        { v1: baseIndex + 0, v2: baseIndex + 5, v3: baseIndex + 1 }
    );
    // Back face (y1)
    triangles.push(
        { v1: baseIndex + 2, v2: baseIndex + 6, v3: baseIndex + 7 },
        { v1: baseIndex + 2, v2: baseIndex + 7, v3: baseIndex + 3 }
    );
    // Left face (x0)
    triangles.push(
        { v1: baseIndex + 0, v2: baseIndex + 3, v3: baseIndex + 7 },
        { v1: baseIndex + 0, v2: baseIndex + 7, v3: baseIndex + 4 }
    );
    // Right face (x1)
    triangles.push(
        { v1: baseIndex + 1, v2: baseIndex + 5, v3: baseIndex + 6 },
        { v1: baseIndex + 1, v2: baseIndex + 6, v3: baseIndex + 2 }
    );
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    // For OpenSCAD masks, we need to create a ZIP file
    // Since JSZip isn't in dependencies, we'll use a simple approach:
    // Generate the SCAD file with embedded base64 images or just download individual files
    
    const { width, height, pixels, partList } = image;
    
    // Generate one B/W PNG per color
    const imageBlobs: Array<{ name: string; blob: Blob }> = [];
    
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => {
                resolve(b!);
            });
        });
        
        const filename = sanitizeFilename(`${part.symbol}_${part.target.name}.png`);
        imageBlobs.push({ name: filename, blob });
    }
    
    // Generate the OpenSCAD file
    const scadContent = buildOpenSCADContent(image, settings);
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    
    // Since we don't have JSZip, download the SCAD file and provide instructions
    // In a real implementation, we would bundle all files into a ZIP
    downloadFile(scadBlob, `${settings.filename}.scad`);
    
    // Download each image
    for (const { name, blob } of imageBlobs) {
        downloadFile(blob, name);
    }
    
    alert(`OpenSCAD export: ${partList.length + 1} files will be downloaded. Please place all files in the same directory.`);
}

function buildOpenSCADContent(image: PartListImage, settings: ThreeDSettings): string {
    const { partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    let scad = `// Generated by firaga.io
// 3D heightmap visualization
// Pixel height: ${pixelHeight}mm
// Base height: ${baseHeight}mm

`;
    
    // Add each color as a separate surface_image
    partList.forEach((part, index) => {
        const filename = sanitizeFilename(`${part.symbol}_${part.target.name}.png`);
        const hex = colorEntryToHex(part.target);
        
        scad += `// ${part.target.name} (${hex})
color("${hex}")
  translate([0, 0, ${baseHeight}])
    surface(file = "${filename}", center = true, invert = true)
      scale([1, 1, ${pixelHeight}]);

`;
    });
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function escapeXML(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
