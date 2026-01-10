import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export function generate3MF(image: PartListImage, filename: string): Blob {
    const materials: string[] = [];
    const meshes: string[] = [];
    
    // Create materials for each color in the part list
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <basematerials:base name="${part.target.name}" displaycolor="#${hex}" />`);
    });
    
    // Create mesh for each color layer
    image.partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Height per layer (in mm)
        const layerHeight = 0.5;
        const z = partIdx * layerHeight;
        
        // Generate vertices and triangles for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    // Create a cube for this pixel
                    // Bottom face vertices
                    const x0 = x, x1 = x + 1;
                    const y0 = y, y1 = y + 1;
                    const z0 = z, z1 = z + layerHeight;
                    
                    const v = vertexCount;
                    // Bottom vertices (z0)
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    // Top vertices (z1)
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // Bottom face (2 triangles)
                    triangles.push(`      <triangle v1="${v+0}" v2="${v+2}" v3="${v+1}" />`);
                    triangles.push(`      <triangle v1="${v+0}" v2="${v+3}" v3="${v+2}" />`);
                    // Top face (2 triangles)
                    triangles.push(`      <triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" />`);
                    triangles.push(`      <triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" />`);
                    // Front face (2 triangles)
                    triangles.push(`      <triangle v1="${v+0}" v2="${v+1}" v3="${v+5}" />`);
                    triangles.push(`      <triangle v1="${v+0}" v2="${v+5}" v3="${v+4}" />`);
                    // Back face (2 triangles)
                    triangles.push(`      <triangle v1="${v+2}" v2="${v+3}" v3="${v+7}" />`);
                    triangles.push(`      <triangle v1="${v+2}" v2="${v+7}" v3="${v+6}" />`);
                    // Left face (2 triangles)
                    triangles.push(`      <triangle v1="${v+3}" v2="${v+0}" v3="${v+4}" />`);
                    triangles.push(`      <triangle v1="${v+3}" v2="${v+4}" v3="${v+7}" />`);
                    // Right face (2 triangles)
                    triangles.push(`      <triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" />`);
                    triangles.push(`      <triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            meshes.push(`    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>`);
        }
    });
    
    const model3D = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${meshes.map((mesh, idx) => `    <object id="${idx + 2}" type="model" materialid="${idx}" name="${image.partList[idx].target.name}">
${mesh}
    </object>`).join('\n')}
  </resources>
  <build>
${meshes.map((_, idx) => `    <item objectid="${idx + 2}" />`).join('\n')}
  </build>
</model>`;
    
    return new Blob([model3D], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

export async function download3MF(image: PartListImage, filename: string) {
    const blob = generate3MF(image, filename);
    
    // For 3MF, we need to create a zip file with the model and [Content_Types].xml and _rels/.rels
    // For simplicity, we'll use a library or create basic structure
    // Since we don't have JSZip, let's create a simple implementation
    
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    
    // We need to create a proper zip file
    // For now, let's download just the model file and add a note about manual packaging
    const modelBlob = blob;
    const url = URL.createObjectURL(modelBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.model`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Note: 3MF export requires additional packaging. The .model file has been downloaded. To create a complete 3MF file, package it in a ZIP with proper structure.');
}
