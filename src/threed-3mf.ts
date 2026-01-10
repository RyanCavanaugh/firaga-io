import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';
import { saveAs } from 'file-saver';

/**
 * Generate a 3MF file with triangle mesh for each color
 */
export async function generate3MF(image: PartListImage, filename: string): Promise<void> {
    const zip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const JSZip = zip.default;
    
    const archive = new JSZip();
    
    // Create content types file
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    archive.file('[Content_Types].xml', contentTypes);
    
    // Create relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    archive.folder('_rels')!.file('.rels', rels);
    
    // Create 3D model file
    const modelXml = generate3DModelXML(image);
    archive.folder('3D')!.file('3dmodel.model', modelXml);
    
    // Generate and save the zip file
    const blob = await archive.generateAsync({ type: 'blob' });
    saveAs(blob, filename.replace(/\.png$/, '') + '.3mf');
}

function generate3DModelXML(image: PartListImage): string {
    const height = 2.0; // Height in mm for each pixel
    const pixelSize = 1.0; // Size of each pixel in mm
    
    let meshes = '';
    let objects = '';
    let components = '';
    
    // Generate a mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove #
        const meshData = generateMeshForColor(image, colorIndex, pixelSize, height);
        
        if (meshData.vertexCount > 0) {
            meshes += `    <basematerials id="material${colorIndex}">
        <base name="${part.target.name}" displaycolor="#${color}"/>
    </basematerials>\n`;
            
            objects += `    <object id="${colorIndex + 1}" type="model">
        <mesh>
${meshData.vertices}
${meshData.triangles}
        </mesh>
    </object>\n`;
            
            components += `        <component objectid="${colorIndex + 1}"/>\n`;
        }
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
${meshes}
${objects}
        <object id="${image.partList.length + 1}" type="model">
            <components>
${components}
            </components>
        </object>
    </resources>
    <build>
        <item objectid="${image.partList.length + 1}"/>
    </build>
</model>`;
}

interface MeshData {
    vertices: string;
    triangles: string;
    vertexCount: number;
}

function generateMeshForColor(image: PartListImage, colorIndex: number, pixelSize: number, height: number): MeshData {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexIndex = 0;
    
    // Build a mesh for all pixels of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                // Create a box for this pixel
                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = 0;
                const z1 = height;
                
                // 8 vertices for a box
                const v = [
                    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // Bottom
                    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // Top
                ];
                
                for (const vertex of v) {
                    vertices.push(`            <vertex x="${vertex[0]}" y="${vertex[1]}" z="${vertex[2]}"/>`);
                }
                
                // 12 triangles for a box (2 per face)
                const baseIdx = vertexIndex;
                const faces = [
                    // Bottom
                    [0, 1, 2], [0, 2, 3],
                    // Top
                    [4, 6, 5], [4, 7, 6],
                    // Front
                    [0, 5, 1], [0, 4, 5],
                    // Back
                    [2, 7, 3], [2, 6, 7],
                    // Left
                    [0, 3, 7], [0, 7, 4],
                    // Right
                    [1, 6, 2], [1, 5, 6]
                ];
                
                for (const face of faces) {
                    triangles.push(`            <triangle v1="${baseIdx + face[0]}" v2="${baseIdx + face[1]}" v3="${baseIdx + face[2]}"/>`);
                }
                
                vertexIndex += 8;
            }
        }
    }
    
    return {
        vertices: vertices.length > 0 ? '            <vertices>\n' + vertices.join('\n') + '\n            </vertices>' : '',
        triangles: triangles.length > 0 ? '            <triangles>\n' + triangles.join('\n') + '\n            </triangles>' : '',
        vertexCount: vertices.length
    };
}
