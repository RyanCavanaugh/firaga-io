import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";

export interface ThreeMFSettings {
    pitch: number;
    height: number;
    filename: string;
}

export async function generate3MF(image: PartListImage, settings: ThreeMFSettings): Promise<Blob> {
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Generate materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        materials.push(`    <basematerials id="${i + 1}">
      <base name="${color.name}" displaycolor="#${hexColor}" />
    </basematerials>`);
    }
    
    // Generate mesh objects for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color and create cubes
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const startVertex = vertexIndex;
                    const x0 = x * settings.pitch;
                    const x1 = (x + 1) * settings.pitch;
                    const y0 = y * settings.pitch;
                    const y1 = (y + 1) * settings.pitch;
                    const z0 = 0;
                    const z1 = settings.height;
                    
                    // 8 vertices of a cube
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    const v = startVertex;
                    // Bottom face
                    triangles.push(`      <triangle v1="${v}" v2="${v + 2}" v3="${v + 1}" />`);
                    triangles.push(`      <triangle v1="${v}" v2="${v + 3}" v3="${v + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${v + 4}" v2="${v + 5}" v3="${v + 6}" />`);
                    triangles.push(`      <triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${v}" v2="${v + 1}" v3="${v + 5}" />`);
                    triangles.push(`      <triangle v1="${v}" v2="${v + 5}" v3="${v + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${v + 2}" v2="${v + 3}" v3="${v + 7}" />`);
                    triangles.push(`      <triangle v1="${v + 2}" v2="${v + 7}" v3="${v + 6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${v + 3}" v2="${v}" v3="${v + 4}" />`);
                    triangles.push(`      <triangle v1="${v + 3}" v2="${v + 4}" v3="${v + 7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${v + 1}" v2="${v + 2}" v3="${v + 6}" />`);
                    triangles.push(`      <triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const objectId = colorIndex + 2;
            objects.push(`    <object id="${objectId}" type="model" pid="${colorIndex + 1}" pindex="0">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    // Build items list
    const items = objects.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n');
    
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${items}
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

    const zip = new JSZip();
    
    // Add files to ZIP in proper 3MF structure
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rels);
    zip.file("3D/3dmodel.model", modelXml);
    
    return await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
