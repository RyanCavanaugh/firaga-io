import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeMFSettings {
    filename: string;
    imageHeight: number;
    pitch: number;
}

export async function make3MF(image: PartListImage, settings: ThreeMFSettings) {
    // Create the 3D model XML
    const modelXml = generate3DModelXml(image, settings.imageHeight, settings.pitch);

    // For now, generate the XML as a downloadable file
    // A full 3MF implementation would require a zip library
    const blob = new Blob([modelXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = settings.filename + ".xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.clarity?.("event", "export-3d-3mf");
}

function generate3DModelXml(image: PartListImage, heightPerColor: number, pitch: number): string {
    // Create mesh data for each color
    let objectId = 1;
    let objects = "";
    const meshes: { objectId: number; colorIndex: number; meshData: string }[] = [];

    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const meshData = generateMeshForColor(image, colorIndex, heightPerColor, pitch);
        if (meshData.triangles.length > 0) {
            meshes.push({
                objectId,
                colorIndex,
                meshData: generateMeshXml(meshData)
            });
            objectId++;
        }
    }

    // Create object definitions
    for (const mesh of meshes) {
        objects += `    <object id="${mesh.objectId}" type="model">
${mesh.meshData}    </object>\n`;
    }

    // Create build items (references to objects)
    let buildItems = "";
    for (const mesh of meshes) {
        const color = colorEntryToHex(mesh.colorIndex < image.partList.length ? image.partList[mesh.colorIndex].target : { r: 0, g: 0, b: 0 });
        buildItems += `      <item objectid="${mesh.objectId}" />\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" unit="millimeter" xml:lang="en-US">
  <resources>
    <basematerials id="1">
${generateColorMaterials(image)}    </basematerials>
  </resources>
  <objects>
${objects}  </objects>
  <build>
${buildItems}  </build>
</model>`;
}

function generateColorMaterials(image: PartListImage): string {
    let materials = "";
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color);
        const r = (color.r / 255).toFixed(4);
        const g = (color.g / 255).toFixed(4);
        const b = (color.b / 255).toFixed(4);
        materials += `      <material id="${i + 1}" type="color" color="${hex}" />\n`;
    }
    return materials;
}

interface MeshData {
    vertices: number[][];
    triangles: { v1: number; v2: number; v3: number; materialId: number }[];
}

function generateMeshForColor(image: PartListImage, colorIndex: number, heightPerColor: number, pitch: number): MeshData {
    const vertices: number[][] = [];
    const triangles: { v1: number; v2: number; v3: number; materialId: number }[] = [];

    // For each pixel with this color, create a cube-like shape
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                // Create a cube at this position
                const px = x * pitch;
                const py = y * pitch;
                const pz = colorIndex * heightPerColor;

                // Add 8 vertices for the cube
                const baseVertexIndex = vertices.length;
                const cubeSize = pitch * 0.9; // Slightly smaller to avoid z-fighting

                // Bottom vertices (z = pz)
                vertices.push([px, py, pz]);
                vertices.push([px + cubeSize, py, pz]);
                vertices.push([px + cubeSize, py + cubeSize, pz]);
                vertices.push([px, py + cubeSize, pz]);

                // Top vertices (z = pz + heightPerColor)
                vertices.push([px, py, pz + heightPerColor]);
                vertices.push([px + cubeSize, py, pz + heightPerColor]);
                vertices.push([px + cubeSize, py + cubeSize, pz + heightPerColor]);
                vertices.push([px, py + cubeSize, pz + heightPerColor]);

                // Add triangles for each face (material ID is colorIndex + 1 to match material IDs)
                // Bottom face (2 triangles)
                triangles.push({ v1: baseVertexIndex, v2: baseVertexIndex + 2, v3: baseVertexIndex + 1, materialId: colorIndex + 1 });
                triangles.push({ v1: baseVertexIndex, v2: baseVertexIndex + 3, v3: baseVertexIndex + 2, materialId: colorIndex + 1 });

                // Top face (2 triangles)
                triangles.push({ v1: baseVertexIndex + 4, v2: baseVertexIndex + 5, v3: baseVertexIndex + 6, materialId: colorIndex + 1 });
                triangles.push({ v1: baseVertexIndex + 4, v2: baseVertexIndex + 6, v3: baseVertexIndex + 7, materialId: colorIndex + 1 });

                // Front face (2 triangles)
                triangles.push({ v1: baseVertexIndex, v2: baseVertexIndex + 1, v3: baseVertexIndex + 5, materialId: colorIndex + 1 });
                triangles.push({ v1: baseVertexIndex, v2: baseVertexIndex + 5, v3: baseVertexIndex + 4, materialId: colorIndex + 1 });

                // Back face (2 triangles)
                triangles.push({ v1: baseVertexIndex + 2, v2: baseVertexIndex + 3, v3: baseVertexIndex + 7, materialId: colorIndex + 1 });
                triangles.push({ v1: baseVertexIndex + 2, v2: baseVertexIndex + 7, v3: baseVertexIndex + 6, materialId: colorIndex + 1 });

                // Left face (2 triangles)
                triangles.push({ v1: baseVertexIndex + 3, v2: baseVertexIndex, v3: baseVertexIndex + 4, materialId: colorIndex + 1 });
                triangles.push({ v1: baseVertexIndex + 3, v2: baseVertexIndex + 4, v3: baseVertexIndex + 7, materialId: colorIndex + 1 });

                // Right face (2 triangles)
                triangles.push({ v1: baseVertexIndex + 1, v2: baseVertexIndex + 2, v3: baseVertexIndex + 6, materialId: colorIndex + 1 });
                triangles.push({ v1: baseVertexIndex + 1, v2: baseVertexIndex + 6, v3: baseVertexIndex + 5, materialId: colorIndex + 1 });
            }
        }
    }

    return { vertices, triangles };
}

function generateMeshXml(meshData: MeshData): string {
    // Generate vertices XML
    let verticesXml = "      <mesh>\n        <vertices>\n";
    for (const v of meshData.vertices) {
        verticesXml += `          <vertex x="${v[0].toFixed(2)}" y="${v[1].toFixed(2)}" z="${v[2].toFixed(2)}" />\n`;
    }
    verticesXml += "        </vertices>\n";

    // Generate triangles XML
    let trianglesXml = "        <triangles>\n";
    for (const t of meshData.triangles) {
        trianglesXml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" p1="${t.materialId}" />\n`;
    }
    trianglesXml += "        </triangles>\n";

    return verticesXml + trianglesXml + "      </mesh>\n";
}
