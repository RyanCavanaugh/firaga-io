import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface Export3MFSettings {
    pixelHeight: number;
    baseHeight: number;
    pixelSize: number;
}

export function export3MF(image: PartListImage, settings: Export3MFSettings): Blob {
    const { pixelHeight, baseHeight, pixelSize } = settings;
    
    const model3mf = generate3MFModel(image, pixelHeight, baseHeight, pixelSize);
    const modelXml = generate3MFModelXML(model3mf);
    const relsXml = generate3MFRels();
    const contentTypesXml = generate3MFContentTypes();
    
    return create3MFZip(modelXml, relsXml, contentTypesXml);
}

interface Triangle {
    v1: [number, number, number];
    v2: [number, number, number];
    v3: [number, number, number];
}

interface ColorMesh {
    colorIndex: number;
    triangles: Triangle[];
}

interface Model3MF {
    meshes: ColorMesh[];
    colors: string[];
}

function generate3MFModel(image: PartListImage, pixelHeight: number, baseHeight: number, pixelSize: number): Model3MF {
    const colors: string[] = [];
    const colorToIndex = new Map<number, number>();
    
    for (let i = 0; i < image.partList.length; i++) {
        const color = colorEntryToHex(image.partList[i].target);
        colors.push(color);
        colorToIndex.set(i, i);
    }
    
    const meshes: ColorMesh[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const triangles: Triangle[] = [];
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const cubeTriangles = generateCube(
                        x * pixelSize,
                        y * pixelSize,
                        baseHeight,
                        pixelSize,
                        pixelSize,
                        pixelHeight
                    );
                    triangles.push(...cubeTriangles);
                }
            }
        }
        
        if (triangles.length > 0) {
            meshes.push({ colorIndex: colorIdx, triangles });
        }
    }
    
    return { meshes, colors };
}

function generateCube(x: number, y: number, z: number, w: number, d: number, h: number): Triangle[] {
    const x0 = x, x1 = x + w;
    const y0 = y, y1 = y + d;
    const z0 = z, z1 = z + h;
    
    return [
        // Front face
        { v1: [x0, y0, z0], v2: [x1, y0, z0], v3: [x1, y0, z1] },
        { v1: [x0, y0, z0], v2: [x1, y0, z1], v3: [x0, y0, z1] },
        // Back face
        { v1: [x0, y1, z0], v2: [x1, y1, z1], v3: [x1, y1, z0] },
        { v1: [x0, y1, z0], v2: [x0, y1, z1], v3: [x1, y1, z1] },
        // Left face
        { v1: [x0, y0, z0], v2: [x0, y0, z1], v3: [x0, y1, z1] },
        { v1: [x0, y0, z0], v2: [x0, y1, z1], v3: [x0, y1, z0] },
        // Right face
        { v1: [x1, y0, z0], v2: [x1, y1, z1], v3: [x1, y0, z1] },
        { v1: [x1, y0, z0], v2: [x1, y1, z0], v3: [x1, y1, z1] },
        // Top face
        { v1: [x0, y0, z1], v2: [x1, y0, z1], v3: [x1, y1, z1] },
        { v1: [x0, y0, z1], v2: [x1, y1, z1], v3: [x0, y1, z1] },
        // Bottom face
        { v1: [x0, y0, z0], v2: [x1, y1, z0], v3: [x1, y0, z0] },
        { v1: [x0, y0, z0], v2: [x0, y1, z0], v3: [x1, y1, z0] },
    ];
}

function generate3MFModelXML(model: Model3MF): string {
    let objectsXml = '';
    
    for (let i = 0; i < model.meshes.length; i++) {
        const mesh = model.meshes[i];
        const vertices: string[] = [];
        const trianglesXml: string[] = [];
        
        for (const tri of mesh.triangles) {
            const v1Idx = vertices.length;
            vertices.push(`<vertex x="${tri.v1[0]}" y="${tri.v1[1]}" z="${tri.v1[2]}" />`);
            const v2Idx = vertices.length;
            vertices.push(`<vertex x="${tri.v2[0]}" y="${tri.v2[1]}" z="${tri.v2[2]}" />`);
            const v3Idx = vertices.length;
            vertices.push(`<vertex x="${tri.v3[0]}" y="${tri.v3[1]}" z="${tri.v3[2]}" />`);
            
            trianglesXml.push(`<triangle v1="${v1Idx}" v2="${v2Idx}" v3="${v3Idx}" pid="1" p1="${mesh.colorIndex}" />`);
        }
        
        objectsXml += `
    <object id="${i + 1}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${trianglesXml.join('\n          ')}
        </triangles>
      </mesh>
    </object>`;
    }
    
    const colorsXml = model.colors.map((color, idx) => 
        `<color color="${color}FF" />`
    ).join('\n      ');
    
    const buildItems = model.meshes.map((_, idx) => 
        `<item objectid="${idx + 1}" />`
    ).join('\n      ');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
      ${colorsXml}
    </basematerials>${objectsXml}
  </resources>
  <build>
    ${buildItems}
  </build>
</model>`;
}

function generate3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function generate3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function create3MFZip(modelXml: string, relsXml: string, contentTypesXml: string): Blob {
    // Simple ZIP creation without external dependencies
    // We'll use a minimal ZIP structure
    const files = [
        { name: '[Content_Types].xml', content: contentTypesXml },
        { name: '_rels/.rels', content: relsXml },
        { name: '3D/3dmodel.model', content: modelXml }
    ];
    
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;
    
    for (const file of files) {
        const content = encoder.encode(file.content);
        const nameBytes = encoder.encode(file.name);
        
        // Local file header
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(localHeader.buffer);
        view.setUint32(0, 0x04034b50, true); // signature
        view.setUint16(4, 20, true); // version
        view.setUint16(6, 0, true); // flags
        view.setUint16(8, 0, true); // compression (none)
        view.setUint16(10, 0, true); // time
        view.setUint16(12, 0, true); // date
        view.setUint32(14, crc32(content), true); // crc32
        view.setUint32(18, content.length, true); // compressed size
        view.setUint32(22, content.length, true); // uncompressed size
        view.setUint16(26, nameBytes.length, true); // filename length
        view.setUint16(28, 0, true); // extra field length
        localHeader.set(nameBytes, 30);
        
        chunks.push(localHeader, content);
        
        // Central directory header
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true); // signature
        centralView.setUint16(4, 20, true); // version made by
        centralView.setUint16(6, 20, true); // version needed
        centralView.setUint16(8, 0, true); // flags
        centralView.setUint16(10, 0, true); // compression
        centralView.setUint16(12, 0, true); // time
        centralView.setUint16(14, 0, true); // date
        centralView.setUint32(16, crc32(content), true); // crc32
        centralView.setUint32(20, content.length, true); // compressed size
        centralView.setUint32(24, content.length, true); // uncompressed size
        centralView.setUint16(28, nameBytes.length, true); // filename length
        centralView.setUint16(30, 0, true); // extra field length
        centralView.setUint16(32, 0, true); // comment length
        centralView.setUint16(34, 0, true); // disk number
        centralView.setUint16(36, 0, true); // internal attributes
        centralView.setUint32(38, 0, true); // external attributes
        centralView.setUint32(42, offset, true); // local header offset
        centralHeader.set(nameBytes, 46);
        
        centralDir.push(centralHeader);
        offset += localHeader.length + content.length;
    }
    
    const centralDirBlob = new Uint8Array(centralDir.reduce((sum, arr) => sum + arr.length, 0));
    let centralDirOffset = 0;
    for (const arr of centralDir) {
        centralDirBlob.set(arr, centralDirOffset);
        centralDirOffset += arr.length;
    }
    
    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // signature
    eocdView.setUint16(4, 0, true); // disk number
    eocdView.setUint16(6, 0, true); // central dir disk
    eocdView.setUint16(8, files.length, true); // entries on this disk
    eocdView.setUint16(10, files.length, true); // total entries
    eocdView.setUint32(12, centralDirBlob.length, true); // central dir size
    eocdView.setUint32(16, offset, true); // central dir offset
    eocdView.setUint16(20, 0, true); // comment length
    
    return new Blob([...chunks, centralDirBlob, eocd], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

function crc32(data: Uint8Array): number {
    let crc = -1;
    for (let i = 0; i < data.length; i++) {
        crc = crc ^ data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xEDB88320 & (-(crc & 1)));
        }
    }
    return ~crc >>> 0;
}
