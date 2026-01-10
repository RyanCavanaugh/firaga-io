import { saveAs } from 'file-saver';
import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

export type Export3MFSettings = {
    baseHeight: number;
    pixelHeight: number;
    filename: string;
};

export async function export3MF(image: PartListImage, settings: Export3MFSettings): Promise<void> {
    const xml = generate3MFModel(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFModel(image: PartListImage, settings: Export3MFSettings): string {
    const pixelSize = 1.0; // 1mm per pixel in X/Y
    const baseZ = settings.baseHeight;
    const pixelZ = settings.pixelHeight;
    
    let vertexIndex = 0;
    const vertices: string[] = [];
    const triangles: string[] = [];
    const objects: Array<{ id: number; name: string; color: string; triangleStart: number; triangleCount: number }> = [];
    
    // Generate base mesh
    const baseVertexStart = vertexIndex;
    const baseWidth = image.width * pixelSize;
    const baseHeight = image.height * pixelSize;
    
    // Base vertices (bottom and top)
    vertices.push(`<vertex x="0" y="0" z="0" />`);
    vertices.push(`<vertex x="${baseWidth}" y="0" z="0" />`);
    vertices.push(`<vertex x="${baseWidth}" y="${baseHeight}" z="0" />`);
    vertices.push(`<vertex x="0" y="${baseHeight}" z="0" />`);
    vertices.push(`<vertex x="0" y="0" z="${baseZ}" />`);
    vertices.push(`<vertex x="${baseWidth}" y="0" z="${baseZ}" />`);
    vertices.push(`<vertex x="${baseWidth}" y="${baseHeight}" z="${baseZ}" />`);
    vertices.push(`<vertex x="0" y="${baseHeight}" z="${baseZ}" />`);
    vertexIndex += 8;
    
    const baseTriangleStart = triangles.length;
    // Base triangles (box)
    addBox(baseVertexStart, triangles);
    const baseTriangleCount = triangles.length - baseTriangleStart;
    
    objects.push({
        id: 1,
        name: "Base",
        color: "#808080",
        triangleStart: baseTriangleStart,
        triangleCount: baseTriangleCount
    });
    
    // Generate pixel meshes for each color
    let objectId = 2;
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const colorVertexStart = vertexIndex;
        const colorTriangleStart = triangles.length;
        let pixelCount = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x1 = x * pixelSize;
                    const y1 = y * pixelSize;
                    const x2 = (x + 1) * pixelSize;
                    const y2 = (y + 1) * pixelSize;
                    const z1 = baseZ;
                    const z2 = baseZ + pixelZ;
                    
                    const vStart = vertexIndex;
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x2}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x2}" y="${y2}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y2}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z2}" />`);
                    vertices.push(`<vertex x="${x2}" y="${y1}" z="${z2}" />`);
                    vertices.push(`<vertex x="${x2}" y="${y2}" z="${z2}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y2}" z="${z2}" />`);
                    vertexIndex += 8;
                    
                    addBox(vStart, triangles);
                    pixelCount++;
                }
            }
        }
        
        const colorTriangleCount = triangles.length - colorTriangleStart;
        if (colorTriangleCount > 0) {
            objects.push({
                id: objectId++,
                name: part.target.name,
                color: colorEntryToHex(part.target),
                triangleStart: colorTriangleStart,
                triangleCount: colorTriangleCount
            });
        }
    }
    
    // Build 3MF XML
    const baseMaterialsXml = objects.map((obj, idx) => 
        `<base name="${escapeXml(obj.name)}" displaycolor="${obj.color.substring(1)}" />`
    ).join('\n    ');
    
    const meshXml = `
  <mesh>
    <vertices>
      ${vertices.join('\n      ')}
    </vertices>
    <triangles>
      ${triangles.join('\n      ')}
    </triangles>
  </mesh>`;
    
    const componentsXml = objects.map(obj => 
        `<component objectid="${obj.id}" />`
    ).join('\n    ');
    
    const objectsXml = objects.map((obj, idx) => `
  <object id="${obj.id}" name="${escapeXml(obj.name)}" type="model">
    ${idx === 0 ? meshXml : `
    <mesh>
      <vertices>
        ${vertices.slice(obj.triangleStart * 3, (obj.triangleStart + obj.triangleCount) * 3 + 1).join('\n        ')}
      </vertices>
      <triangles>
        ${triangles.slice(obj.triangleStart, obj.triangleStart + obj.triangleCount).join('\n        ')}
      </triangles>
    </mesh>`}
  </object>`).join('\n');
    
    // Simplified approach: single mesh with all geometry
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${escapeXml(settings.filename)}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="1">
      ${baseMaterialsXml}
    </basematerials>
    <object id="2" name="PixelArt" type="model">
      ${meshXml}
    </object>
  </resources>
  <build>
    <item objectid="2" />
  </build>
</model>`;
    
    return xml;
}

function addBox(vertexStart: number, triangles: string[]): void {
    // Bottom face (z=0)
    triangles.push(`<triangle v1="${vertexStart + 0}" v2="${vertexStart + 2}" v3="${vertexStart + 1}" />`);
    triangles.push(`<triangle v1="${vertexStart + 0}" v2="${vertexStart + 3}" v3="${vertexStart + 2}" />`);
    // Top face (z=height)
    triangles.push(`<triangle v1="${vertexStart + 4}" v2="${vertexStart + 5}" v3="${vertexStart + 6}" />`);
    triangles.push(`<triangle v1="${vertexStart + 4}" v2="${vertexStart + 6}" v3="${vertexStart + 7}" />`);
    // Front face (y=0)
    triangles.push(`<triangle v1="${vertexStart + 0}" v2="${vertexStart + 1}" v3="${vertexStart + 5}" />`);
    triangles.push(`<triangle v1="${vertexStart + 0}" v2="${vertexStart + 5}" v3="${vertexStart + 4}" />`);
    // Back face (y=height)
    triangles.push(`<triangle v1="${vertexStart + 2}" v2="${vertexStart + 3}" v3="${vertexStart + 7}" />`);
    triangles.push(`<triangle v1="${vertexStart + 2}" v2="${vertexStart + 7}" v3="${vertexStart + 6}" />`);
    // Left face (x=0)
    triangles.push(`<triangle v1="${vertexStart + 0}" v2="${vertexStart + 4}" v3="${vertexStart + 7}" />`);
    triangles.push(`<triangle v1="${vertexStart + 0}" v2="${vertexStart + 7}" v3="${vertexStart + 3}" />`);
    // Right face (x=width)
    triangles.push(`<triangle v1="${vertexStart + 1}" v2="${vertexStart + 2}" v3="${vertexStart + 6}" />`);
    triangles.push(`<triangle v1="${vertexStart + 1}" v2="${vertexStart + 6}" v3="${vertexStart + 5}" />`);
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
