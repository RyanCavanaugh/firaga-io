import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Generates a 3MF file (3D Manufacturing Format) with triangle meshes for each color
 */
export function generate3MF(image: PartListImage, filename: string) {
    const height = 0.5; // Height of each pixel/voxel
    const pixelSize = 1.0; // Size of each pixel in mm

    // Build meshes for each color
    const meshes: string[] = [];
    const resources: string[] = [];
    
    // Create a material for each color in the part list
    const materials: string[] = [];
    image.partList.forEach((part, index) => {
        const color = part.target;
        // Convert RGB to hex format for 3MF (sRGB color space)
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        materials.push(`    <basematerials id="${index + 2}">
      <base name="${color.name}" displaycolor="#${r}${g}${b}" />
    </basematerials>`);
    });

    // Generate mesh for each color
    image.partList.forEach((part, colorIndex) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const baseIndex = vertexCount;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;

                    // 8 vertices of the box
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 2}" v3="${baseIndex + 1}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 3}" v3="${baseIndex + 2}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${baseIndex + 4}" v2="${baseIndex + 5}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 4}" v2="${baseIndex + 6}" v3="${baseIndex + 7}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 1}" v3="${baseIndex + 5}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 0}" v2="${baseIndex + 5}" v3="${baseIndex + 4}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${baseIndex + 2}" v2="${baseIndex + 3}" v3="${baseIndex + 7}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 2}" v2="${baseIndex + 7}" v3="${baseIndex + 6}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${baseIndex + 3}" v2="${baseIndex + 0}" v3="${baseIndex + 4}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 3}" v2="${baseIndex + 4}" v3="${baseIndex + 7}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${baseIndex + 1}" v2="${baseIndex + 2}" v3="${baseIndex + 6}" />`);
                    triangles.push(`      <triangle v1="${baseIndex + 1}" v2="${baseIndex + 6}" v3="${baseIndex + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const meshId = colorIndex + 100;
            const materialId = colorIndex + 2;
            resources.push(`    <object id="${meshId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
            
            meshes.push(`      <item objectid="${meshId}" pid="${materialId}" pindex="0" />`);
        }
    });

    // Generate the 3MF XML
    const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${resources.join('\n')}
    <object id="1" type="model">
      <components>
${meshes.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    // Create a minimal 3MF package (ZIP file with specific structure)
    // 3MF requires: [Content_Types].xml, _rels/.rels, and 3D/3dmodel.model
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    // Create a 3MF package (ZIP file with specific structure)
    // 3MF requires: [Content_Types].xml, _rels/.rels, and 3D/3dmodel.model
    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.folder('_rels')!.file('.rels', rels);
    zip.folder('3D')!.file('3dmodel.model', model);
    
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, `${filename}.3mf`);
    });
}
