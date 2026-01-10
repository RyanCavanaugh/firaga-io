import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DFormat = '3mf' | 'openscad-masks';

export async function export3D(image: PartListImage, format: Export3DFormat, filename: string) {
    if (format === '3mf') {
        await export3MF(image, filename);
    } else if (format === 'openscad-masks') {
        await exportOpenSCADMasks(image, filename);
    }
}

async function export3MF(image: PartListImage, filename: string) {
    const zip = new JSZip();
    
    // Add required 3MF files
    zip.file('[Content_Types].xml', generateContentTypesXML());
    
    const relsFolder = zip.folder('_rels');
    relsFolder!.file('.rels', generateRelsXML());
    
    const modelFolder = zip.folder('3D');
    modelFolder!.file('3dmodel.model', generate3DModelXML(image));
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}.3mf`);
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

function generate3DModelXML(image: PartListImage): string {
    const beadHeight = 0.5; // Height of each bead in mm
    const beadSize = 1.0; // Size of each bead in mm (assuming 1mm grid spacing)
    
    let vertices = '';
    let triangles = '';
    let vertexIndex = 0;
    let triangleIndex = 0;
    
    const colorObjects: { [key: number]: { vertices: string, triangles: string, vertexOffset: number } } = {};
    
    // Generate geometry for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        let colorVertices = '';
        let colorTriangles = '';
        let colorVertexOffset = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a simple box for each bead
                    const x0 = x * beadSize;
                    const y0 = y * beadSize;
                    const x1 = (x + 1) * beadSize;
                    const y1 = (y + 1) * beadSize;
                    const z0 = 0;
                    const z1 = beadHeight;
                    
                    // 8 vertices for a box
                    const verts = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];
                    
                    const baseIdx = colorVertexOffset;
                    verts.forEach(v => {
                        colorVertices += `        <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>\n`;
                        colorVertexOffset++;
                    });
                    
                    // 12 triangles for a box (2 per face, 6 faces)
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];
                    
                    faces.forEach(f => {
                        colorTriangles += `        <triangle v1="${baseIdx + f[0]}" v2="${baseIdx + f[1]}" v3="${baseIdx + f[2]}"/>\n`;
                    });
                }
            }
        }
        
        if (colorVertexOffset > 0) {
            colorObjects[colorIdx] = {
                vertices: colorVertices,
                triangles: colorTriangles,
                vertexOffset: colorVertexOffset
            };
        }
    }
    
    // Build the 3MF model XML
    let baseMaterials = '';
    let objects = '';
    let objectId = 1;
    
    for (const colorIdx in colorObjects) {
        const partEntry = image.partList[parseInt(colorIdx)];
        const color = partEntry.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove the #
        
        baseMaterials += `        <base name="${color.name}" displaycolor="#${hexColor}FF"/>\n`;
        
        const colorData = colorObjects[parseInt(colorIdx)];
        objects += `    <object id="${objectId}" type="model">\n`;
        objects += `        <mesh>\n`;
        objects += `            <vertices>\n`;
        objects += colorData.vertices;
        objects += `            </vertices>\n`;
        objects += `            <triangles>\n`;
        objects += colorData.triangles;
        objects += `            </triangles>\n`;
        objects += `        </mesh>\n`;
        objects += `    </object>\n`;
        objectId++;
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
${baseMaterials}        </basematerials>
${objects}        <build>
${Object.keys(colorObjects).map((_, idx) => `            <item objectid="${idx + 1}"/>`).join('\n')}
        </build>
    </resources>
</model>`;
}

async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    const zip = new JSZip();
    
    // Create one monochrome image per color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageFiles: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const partEntry = image.partList[colorIdx];
        const color = partEntry.target;
        
        // Create black and white mask
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const pixelValue = image.pixels[y][x] === colorIdx ? 255 : 0;
                imageData.data[idx] = pixelValue;     // R
                imageData.data[idx + 1] = pixelValue; // G
                imageData.data[idx + 2] = pixelValue; // B
                imageData.data[idx + 3] = 255;        // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const imageFilename = `color_${colorIdx}_${safeName}.png`;
        imageFiles.push(imageFilename);
        
        zip.file(imageFilename, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles);
    zip.file(`${filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, imageFiles: string[]): string {
    let scadCode = `// OpenSCAD 3D representation of bead art
// Each color is represented as a separate heightmap layer

// Parameters
bead_size = 1.0;  // Size of each bead in mm
layer_height = 0.5;  // Height of each layer

`;
    
    for (let i = 0; i < imageFiles.length; i++) {
        const partEntry = image.partList[i];
        const color = partEntry.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadCode += `// Layer for ${color.name}\n`;
        scadCode += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadCode += `scale([bead_size, bead_size, layer_height])\n`;
        scadCode += `surface(file = "${imageFiles[i]}", center = true, invert = true);\n\n`;
    }
    
    return scadCode;
}
