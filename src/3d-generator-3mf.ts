import { PartListImage } from './image-utils';
import { ColorEntry } from './color-data';
import { saveAs } from 'file-saver';

export interface ThreeDSettings {
    pitch: number;
    height: number;
    filename: string;
}

export function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const { pitch, height, filename } = settings;
    
    // Build 3MF XML structure
    const modelXml = build3MFModel(image, pitch, height);
    const contentTypesXml = buildContentTypes();
    const relsXml = buildRels();
    
    // Create zip file with 3MF structure
    createZipAndDownload(modelXml, contentTypesXml, relsXml, filename);
}

function build3MFModel(image: PartListImage, pitch: number, height: number): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials for each color
    xml += '    <basematerials id="1">\n';
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(6);
        const g = (color.g / 255).toFixed(6);
        const b = (color.b / 255).toFixed(6);
        xml += `      <base name="${escapeXml(color.name)}" displaycolor="#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Create mesh objects for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    image.partList.forEach((part, partIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    addCube(x, y, vertices, triangles, vertexMap, pitch, height);
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${objectId}" type="model">\n`;
            xml += '      <mesh>\n';
            xml += '        <vertices>\n';
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0].toFixed(6)}" y="${v[1].toFixed(6)}" z="${v[2].toFixed(6)}" />\n`;
            });
            xml += '        </vertices>\n';
            xml += '        <triangles>\n';
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${partIndex}" />\n`;
            });
            xml += '        </triangles>\n';
            xml += '      </mesh>\n';
            xml += '    </object>\n';
            objectIds.push(objectId);
            objectId++;
        }
    });
    
    // Create build item that references all objects
    xml += '  </resources>\n';
    xml += '  <build>\n';
    objectIds.forEach(id => {
        xml += `    <item objectid="${id}" />\n`;
    });
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function addCube(
    x: number,
    y: number,
    vertices: Array<[number, number, number]>,
    triangles: Array<[number, number, number, number]>,
    vertexMap: Map<string, number>,
    pitch: number,
    height: number
): void {
    const x0 = x * pitch;
    const x1 = (x + 1) * pitch;
    const y0 = y * pitch;
    const y1 = (y + 1) * pitch;
    const z0 = 0;
    const z1 = height;
    
    // Define 8 vertices of the cube
    const cubeVertices: Array<[number, number, number]> = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], // top
    ];
    
    const indices: number[] = [];
    cubeVertices.forEach(v => {
        const key = `${v[0]},${v[1]},${v[2]}`;
        let idx = vertexMap.get(key);
        if (idx === undefined) {
            idx = vertices.length;
            vertices.push(v);
            vertexMap.set(key, idx);
        }
        indices.push(idx);
    });
    
    // Define 12 triangles (2 per face, 6 faces)
    const faces: Array<[number, number, number]> = [
        // Bottom
        [indices[0], indices[2], indices[1]], [indices[0], indices[3], indices[2]],
        // Top
        [indices[4], indices[5], indices[6]], [indices[4], indices[6], indices[7]],
        // Front
        [indices[0], indices[1], indices[5]], [indices[0], indices[5], indices[4]],
        // Back
        [indices[2], indices[3], indices[7]], [indices[2], indices[7], indices[6]],
        // Left
        [indices[3], indices[0], indices[4]], [indices[3], indices[4], indices[7]],
        // Right
        [indices[1], indices[2], indices[6]], [indices[1], indices[6], indices[5]],
    ];
    
    faces.forEach(f => {
        triangles.push([f[0], f[1], f[2], 0]);
    });
}

function buildContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function buildRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`;
}

async function createZipAndDownload(
    modelXml: string,
    contentTypesXml: string,
    relsXml: string,
    filename: string
): Promise<void> {
    // Use JSZip to create the 3MF file
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    zip.file('[Content_Types].xml', contentTypesXml);
    zip.file('_rels/.rels', relsXml);
    zip.file('3D/3dmodel.model', modelXml);
    
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    saveAs(blob, `${filename}.3mf`);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
}
