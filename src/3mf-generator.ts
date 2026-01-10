import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    height: number; // Height in mm for the 3D extrusion
    pixelSize: number; // Size of each pixel in mm
    filename: string;
}

export async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = generate3MFContent(image, settings);
    downloadFile(xml, settings.filename + ".3mf", "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const pixelSize = settings.pixelSize;
    const depth = settings.height;

    let vertexId = 1;
    let triangleId = 1;
    const meshes: string[] = [];
    const resources: string[] = [];
    const components: string[] = [];

    // Generate a mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx].target;
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;

        // Find all pixels of this color and create boxes for them
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    // Create a box (8 vertices, 12 triangles)
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = depth;

                    // 8 vertices of the box
                    const v0 = localVertexId++;
                    const v1 = localVertexId++;
                    const v2 = localVertexId++;
                    const v3 = localVertexId++;
                    const v4 = localVertexId++;
                    const v5 = localVertexId++;
                    const v6 = localVertexId++;
                    const v7 = localVertexId++;

                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`<triangle v1="${v0}" v2="${v2}" v3="${v1}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v3}" v3="${v2}"/>`);
                    // Top face (z1)
                    triangles.push(`<triangle v1="${v4}" v2="${v5}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v4}" v2="${v6}" v3="${v7}"/>`);
                    // Front face (y0)
                    triangles.push(`<triangle v1="${v0}" v2="${v1}" v3="${v5}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v5}" v3="${v4}"/>`);
                    // Back face (y1)
                    triangles.push(`<triangle v1="${v2}" v2="${v3}" v3="${v7}"/>`);
                    triangles.push(`<triangle v1="${v2}" v2="${v7}" v3="${v6}"/>`);
                    // Left face (x0)
                    triangles.push(`<triangle v1="${v0}" v2="${v4}" v3="${v7}"/>`);
                    triangles.push(`<triangle v1="${v0}" v2="${v7}" v3="${v3}"/>`);
                    // Right face (x1)
                    triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v6}"/>`);
                    triangles.push(`<triangle v1="${v1}" v2="${v6}" v3="${v5}"/>`);
                }
            }
        }

        if (vertices.length > 0) {
            const meshId = `mesh_${colorIdx}`;
            const colorHex = colorEntryToHex(color).substring(1); // Remove '#'
            
            meshes.push(`
    <object id="${vertexId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);

            resources.push(`
    <basematerials id="material_${colorIdx}">
      <base name="${color.name}" displaycolor="#${colorHex}" />
    </basematerials>`);

            components.push(`
      <component objectid="${vertexId}" />`);

            vertexId++;
        }
    }

    const xml3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${meshes.join('\n')}
${resources.join('\n')}
    <object id="${vertexId}" type="model">
      <components>
${components.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${vertexId}" />
  </build>
</model>`;

    return xml3mf;
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
