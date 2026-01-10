import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from "file-saver";

export function generate3MF(image: PartListImage, filename: string): void {
    const xml = build3MFDocument(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function build3MFDocument(image: PartListImage): string {
    const depth = 2.0;
    const pixelSize = 1.0;
    
    let vertexId = 1;
    let triangleId = 1;
    const materials: string[] = [];
    const objects: string[] = [];
    
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const color = colorEntryToHex(part.target);
        const materialId = partIdx + 1;
        
        materials.push(
            `    <basematerials id="${materialId}">` +
            `      <base name="${escapeXml(part.target.name)}" displaycolor="${color.substring(1)}" />` +
            `    </basematerials>`
        );
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        const startVertex = vertexId;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    
                    const baseVert = vertexId - startVertex;
                    
                    vertices.push(
                        `        <vertex x="${x0}" y="${y0}" z="0" />`,
                        `        <vertex x="${x1}" y="${y0}" z="0" />`,
                        `        <vertex x="${x1}" y="${y1}" z="0" />`,
                        `        <vertex x="${x0}" y="${y1}" z="0" />`,
                        `        <vertex x="${x0}" y="${y0}" z="${depth}" />`,
                        `        <vertex x="${x1}" y="${y0}" z="${depth}" />`,
                        `        <vertex x="${x1}" y="${y1}" z="${depth}" />`,
                        `        <vertex x="${x0}" y="${y1}" z="${depth}" />`
                    );
                    
                    triangles.push(
                        `        <triangle v1="${baseVert}" v2="${baseVert + 1}" v3="${baseVert + 2}" />`,
                        `        <triangle v1="${baseVert}" v2="${baseVert + 2}" v3="${baseVert + 3}" />`,
                        `        <triangle v1="${baseVert + 4}" v2="${baseVert + 6}" v3="${baseVert + 5}" />`,
                        `        <triangle v1="${baseVert + 4}" v2="${baseVert + 7}" v3="${baseVert + 6}" />`,
                        `        <triangle v1="${baseVert}" v2="${baseVert + 4}" v3="${baseVert + 5}" />`,
                        `        <triangle v1="${baseVert}" v2="${baseVert + 5}" v3="${baseVert + 1}" />`,
                        `        <triangle v1="${baseVert + 1}" v2="${baseVert + 5}" v3="${baseVert + 6}" />`,
                        `        <triangle v1="${baseVert + 1}" v2="${baseVert + 6}" v3="${baseVert + 2}" />`,
                        `        <triangle v1="${baseVert + 2}" v2="${baseVert + 6}" v3="${baseVert + 7}" />`,
                        `        <triangle v1="${baseVert + 2}" v2="${baseVert + 7}" v3="${baseVert + 3}" />`,
                        `        <triangle v1="${baseVert + 3}" v2="${baseVert + 7}" v3="${baseVert + 4}" />`,
                        `        <triangle v1="${baseVert + 3}" v2="${baseVert + 4}" v3="${baseVert}" />`
                    );
                    
                    vertexId += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const objectId = objects.length + 2;
            objects.push(
                `    <object id="${objectId}" type="model">`,
                `      <mesh>`,
                `        <vertices>`,
                ...vertices,
                `        </vertices>`,
                `        <triangles>`,
                ...triangles,
                `        </triangles>`,
                `      </mesh>`,
                `    </object>`
            );
        }
    }
    
    const buildItems = objects.map((_, idx) => 
        `      <item objectid="${idx + 2}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${objects.join('\n')}
    <object id="1" type="model">
      <components>
${buildItems}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
