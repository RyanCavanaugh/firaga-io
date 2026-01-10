import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DSettings = {
    format: "3mf" | "openscad";
    filename: string;
    pitch: number;
    beadHeight: number;
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const { width, height, pixels, partList } = image;
    const pitch = settings.pitch;
    const beadHeight = settings.beadHeight;

    // Build materials list
    let materialsXml = '';
    const colorIds = new Map<number, number>();
    for (let i = 0; i < partList.length; i++) {
        const entry = partList[i];
        const color = colorEntryToHex(entry.target);
        const colorId = i + 1;
        colorIds.set(i, colorId);
        // Remove # from hex color and add alpha
        const colorValue = color.substring(1) + 'FF';
        materialsXml += `    <basematerials:base name="${entry.target.name}" displaycolor="#${colorValue}" />\n`;
    }

    // Build mesh vertices and triangles for each color
    let objectsXml = '';
    
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Create cubes for each bead of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    // Add a cube at position (x, y)
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = x0 + pitch;
                    const y1 = y0 + pitch;
                    const z0 = 0;
                    const z1 = beadHeight;

                    const baseIdx = vertexCount;
                    // Add 8 vertices for the cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`      <triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}" />`);
                    triangles.push(`      <triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}" />`);
                    // Top face (z=z1)
                    triangles.push(`      <triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}" />`);
                    // Front face (y=y0)
                    triangles.push(`      <triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}" />`);
                    triangles.push(`      <triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}" />`);
                    // Back face (y=y1)
                    triangles.push(`      <triangle v1="${baseIdx+3}" v2="${baseIdx+7}" v3="${baseIdx+6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx+3}" v2="${baseIdx+6}" v3="${baseIdx+2}" />`);
                    // Left face (x=x0)
                    triangles.push(`      <triangle v1="${baseIdx+0}" v2="${baseIdx+4}" v3="${baseIdx+7}" />`);
                    triangles.push(`      <triangle v1="${baseIdx+0}" v2="${baseIdx+7}" v3="${baseIdx+3}" />`);
                    // Right face (x=x1)
                    triangles.push(`      <triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}" />`);
                    triangles.push(`      <triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const colorId = colorIds.get(partIdx)!;
            const objectId = partIdx + 1;
            objectsXml += `  <object id="${objectId}" type="model" pid="${colorId}" pindex="0">\n`;
            objectsXml += `    <mesh>\n`;
            objectsXml += `    <vertices>\n`;
            objectsXml += vertices.join('\n') + '\n';
            objectsXml += `    </vertices>\n`;
            objectsXml += `    <triangles>\n`;
            objectsXml += triangles.join('\n') + '\n';
            objectsXml += `    </triangles>\n`;
            objectsXml += `    </mesh>\n`;
            objectsXml += `  </object>\n`;
        }
    }

    // Build the complete 3MF file structure
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materialsXml}    </basematerials:basematerials>
${objectsXml}  </resources>
  <build>
${Array.from({ length: partList.length }, (_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    // Create a zip file using JSZip (we'll need to add this dependency or use a workaround)
    // For now, create a simple implementation
    const zip = await createZip({
        '[Content_Types].xml': contentTypes,
        '_rels/.rels': rels,
        '3D/3dmodel.model': modelXml
    });

    saveAs(zip, settings.filename + '.3mf');
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const { width, height, pixels, partList } = image;
    const pitch = settings.pitch;

    // Create binary masks for each color
    const masks: { [key: string]: Blob } = {};
    const colors: { name: string, hex: string }[] = [];

    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const entry = partList[partIdx];
        const colorHex = colorEntryToHex(entry.target);
        colors.push({ name: entry.target.name, hex: colorHex });

        // Create a canvas for the mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        masks[`color_${partIdx}.png`] = blob;
    }

    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel pitch: ${pitch}mm

module bead_layer(image_file, color) {
    color(color)
    linear_extrude(height = 1)
    scale([${pitch}, ${pitch}, 1])
    surface(file = image_file, invert = true, center = false);
}

`;

    for (let i = 0; i < colors.length; i++) {
        const hex = colors[i].hex.substring(1); // Remove #
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        scadContent += `bead_layer("color_${i}.png", [${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}]);\n`;
    }

    masks['beads.scad'] = new Blob([scadContent], { type: 'text/plain' });

    // Create zip file
    const zip = await createZip(masks);
    saveAs(zip, settings.filename + '_openscad.zip');
}

// Create zip file using JSZip
async function createZip(files: { [filename: string]: string | Blob }): Promise<Blob> {
    const zip = new JSZip();
    
    for (const [filename, content] of Object.entries(files)) {
        zip.file(filename, content);
    }
    
    return await zip.generateAsync({ type: 'blob' });
}
