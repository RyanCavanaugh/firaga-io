import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';
import { saveAs } from 'file-saver';

export function export3MF(image: PartListImage, filename: string) {
    const model3d = generate3MFModel(image);
    const modelXml = createModelXML(model3d);
    const contentTypesXml = createContentTypesXML();
    const relsXml = createRelsXML();
    
    // For browser environment, we'll create a simple 3MF structure
    // A proper 3MF would be a ZIP file with multiple files
    // For simplicity, we'll create the main model XML and save it
    // In production, you'd use JSZip or similar to create proper 3MF
    
    const blob = new Blob([modelXml], { type: 'application/xml' });
    saveAs(blob, filename.replace(/\.[^.]+$/, '') + '.model');
}

interface Model3D {
    vertices: number[][];
    triangles: Array<{
        colorIndex: number;
        indices: [number, number, number];
    }>;
    colors: string[];
}

function generate3MFModel(image: PartListImage): Model3D {
    const vertices: number[][] = [];
    const triangles: Array<{ colorIndex: number; indices: [number, number, number] }> = [];
    const colorMap = new Map<number, number>();
    const colors: string[] = [];
    
    // Build color mapping
    image.partList.forEach((part, idx) => {
        colorMap.set(idx, colors.length);
        colors.push(colorEntryToHex(part.target));
    });
    
    const height = 1.0; // Height of each pixel in 3D space
    const pixelSize = 1.0; // Size of each pixel
    
    // Generate mesh for each pixel
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIdx = image.pixels[y][x];
            if (colorIdx === undefined) continue;
            
            const colorMaterialIdx = colorMap.get(colorIdx) ?? 0;
            
            // Create a rectangular prism (box) for each pixel
            const x0 = x * pixelSize;
            const y0 = y * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y1 = (y + 1) * pixelSize;
            const z0 = 0;
            const z1 = height;
            
            const baseVertIdx = vertices.length;
            
            // 8 vertices of the box
            vertices.push(
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
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
            
            faces.forEach(([a, b, c]) => {
                triangles.push({
                    colorIndex: colorMaterialIdx,
                    indices: [baseVertIdx + a, baseVertIdx + b, baseVertIdx + c]
                });
            });
        }
    }
    
    return { vertices, triangles, colors };
}

function createModelXML(model: Model3D): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials/colors
    xml += '    <basematerials id="1">\n';
    model.colors.forEach((color, idx) => {
        xml += `      <base name="Color${idx}" displaycolor="${color}" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Define mesh
    xml += '    <object id="2" type="model">\n';
    xml += '      <mesh>\n';
    xml += '        <vertices>\n';
    model.vertices.forEach(([x, y, z]) => {
        xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
    });
    xml += '        </vertices>\n';
    xml += '        <triangles>\n';
    model.triangles.forEach(({ colorIndex, indices }) => {
        xml += `          <triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}" pid="1" p1="${colorIndex}" />\n`;
    });
    xml += '        </triangles>\n';
    xml += '      </mesh>\n';
    xml += '    </object>\n';
    xml += '  </resources>\n';
    xml += '  <build>\n';
    xml += '    <item objectid="2" />\n';
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function createContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function createRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}
