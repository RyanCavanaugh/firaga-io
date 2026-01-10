import { saveAs } from 'file-saver';
import * as JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad-masks';

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await generate3MF(image, settings);
    } else if (settings.format === 'openscad-masks') {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const pixelSize = 1.0; // 1mm per pixel in X/Y
    const meshes: string[] = [];
    const materials: Array<{ id: number; color: string }> = [];

    // Generate materials for each color
    image.partList.forEach((part, index) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove # prefix
        materials.push({ id: index + 1, color });
    });

    // Generate meshes for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        let vertexIndex = 0;

        // Build mesh for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.pixelHeight;

                    // 8 vertices of the box
                    const baseIndex = vertexIndex;
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // Bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // Top
                    );

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=z0)
                    triangles.push([baseIndex + 0, baseIndex + 2, baseIndex + 1]);
                    triangles.push([baseIndex + 0, baseIndex + 3, baseIndex + 2]);
                    // Top face (z=z1)
                    triangles.push([baseIndex + 4, baseIndex + 5, baseIndex + 6]);
                    triangles.push([baseIndex + 4, baseIndex + 6, baseIndex + 7]);
                    // Front face (y=y0)
                    triangles.push([baseIndex + 0, baseIndex + 1, baseIndex + 5]);
                    triangles.push([baseIndex + 0, baseIndex + 5, baseIndex + 4]);
                    // Back face (y=y1)
                    triangles.push([baseIndex + 2, baseIndex + 3, baseIndex + 7]);
                    triangles.push([baseIndex + 2, baseIndex + 7, baseIndex + 6]);
                    // Left face (x=x0)
                    triangles.push([baseIndex + 0, baseIndex + 4, baseIndex + 7]);
                    triangles.push([baseIndex + 0, baseIndex + 7, baseIndex + 3]);
                    // Right face (x=x1)
                    triangles.push([baseIndex + 1, baseIndex + 2, baseIndex + 6]);
                    triangles.push([baseIndex + 1, baseIndex + 6, baseIndex + 5]);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            meshes.push(buildMeshXML(vertices, triangles, colorIndex + 1));
        }
    });

    const model3D = build3MFModel(meshes, materials);
    const zip = new JSZip.default();
    
    zip.file('3D/3dmodel.model', model3D);
    zip.file('[Content_Types].xml', buildContentTypesXML());
    zip.file('_rels/.rels', buildRelsXML());

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function buildMeshXML(vertices: Array<[number, number, number]>, triangles: Array<[number, number, number]>, pid: number): string {
    let xml = `    <mesh>\n      <vertices>\n`;
    
    vertices.forEach(([x, y, z]) => {
        xml += `        <vertex x="${x}" y="${y}" z="${z}" />\n`;
    });
    
    xml += `      </vertices>\n      <triangles>\n`;
    
    triangles.forEach(([v1, v2, v3]) => {
        xml += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${pid}" />\n`;
    });
    
    xml += `      </triangles>\n    </mesh>\n`;
    return xml;
}

function build3MFModel(meshes: string[], materials: Array<{ id: number; color: string }>): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;
    
    materials.forEach((mat) => {
        xml += `      <base name="Color${mat.id}" displaycolor="#${mat.color}" />\n`;
    });
    
    xml += `    </basematerials>\n`;
    
    meshes.forEach((mesh, index) => {
        xml += `    <object id="${index + 2}" type="model" pid="1">\n${mesh}    </object>\n`;
    });
    
    xml += `  </resources>
  <build>
`;
    
    meshes.forEach((_, index) => {
        xml += `    <item objectid="${index + 2}" />\n`;
    });
    
    xml += `  </build>
</model>`;
    
    return xml;
}

function buildContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function buildRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip.default();
    const pixelSize = 1.0; // 1mm per pixel

    // Generate one mask image per color
    const maskPromises = image.partList.map(async (part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw black pixels where this color appears
        ctx.fillStyle = '#000000';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        return new Promise<{ name: string; data: Blob }>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const colorName = part.target.code || part.symbol;
                    resolve({ name: `mask_${colorName}.png`, data: blob });
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            });
        });
    });

    const masks = await Promise.all(maskPromises);
    
    // Add mask images to zip
    masks.forEach((mask) => {
        zip.file(mask.name, mask.data);
    });

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings, masks.map(m => m.name));
    zip.file('model.scad', scadContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(
    image: PartListImage,
    settings: ThreeDSettings,
    maskFiles: string[]
): string {
    const pixelSize = 1.0;
    let scad = `// Generated by firaga.io
// Image size: ${image.width}x${image.height}
// Pixel size: ${pixelSize}mm

`;

    // Add color modules
    image.partList.forEach((part, index) => {
        const colorName = part.target.code || part.symbol;
        const colorHex = colorEntryToHex(part.target);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scad += `// ${part.target.name} (${colorHex})
module color_${colorName.replace(/[^a-zA-Z0-9]/g, '_')}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    translate([0, 0, ${settings.baseHeight}])
    scale([${pixelSize}, ${pixelSize}, ${settings.pixelHeight}])
    surface(file = "${maskFiles[index]}", center = false, invert = true);
}

`;
    });

    // Create union of all color layers
    scad += `// Combine all colors
union() {
`;
    
    image.partList.forEach((part) => {
        const colorName = part.target.code || part.symbol;
        scad += `    color_${colorName.replace(/[^a-zA-Z0-9]/g, '_')}();\n`;
    });
    
    scad += `}\n`;

    return scad;
}
