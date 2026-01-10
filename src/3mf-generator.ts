import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeMFSettings = {
  filename: string;
  layerHeight: number;
  pegHeight: number;
};

export function generate3MF(image: PartListImage, settings: ThreeMFSettings): void {
  const xml = create3MFContent(image, settings);
  const blob = new Blob([xml], { type: "application/xml" });
  downloadFile(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeMFSettings): string {
  const { width, height, partList, pixels } = image;
  const { layerHeight, pegHeight } = settings;

  const meshes: string[] = [];
  const resources: string[] = [];

  partList.forEach((part, colorIdx) => {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[y][x] === colorIdx) {
          const pegVertices = createPeg(x, y, layerHeight, pegHeight);
          pegVertices.forEach(v => {
            vertices.push(`      <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`);
          });

          const pegTriangles = getPegTriangles(vertexCount);
          pegTriangles.forEach(t => {
            triangles.push(`      <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`);
          });
          
          vertexCount += 8;
        }
      }
    }

    if (vertices.length > 0) {
      const colorHex = colorEntryToHex(part.target).substring(1);
      const objectId = colorIdx + 1;
      
      resources.push(`    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);

      meshes.push(`    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0" />`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${meshes.join('\n')}
  </build>
</model>`;
}

type Vertex = { x: number; y: number; z: number };

function createPeg(x: number, y: number, layerHeight: number, pegHeight: number): Vertex[] {
  const baseX = x;
  const baseY = y;
  const baseZ = 0;

  return [
    { x: baseX, y: baseY, z: baseZ },
    { x: baseX + 1, y: baseY, z: baseZ },
    { x: baseX + 1, y: baseY + 1, z: baseZ },
    { x: baseX, y: baseY + 1, z: baseZ },
    { x: baseX, y: baseY, z: baseZ + pegHeight },
    { x: baseX + 1, y: baseY, z: baseZ + pegHeight },
    { x: baseX + 1, y: baseY + 1, z: baseZ + pegHeight },
    { x: baseX, y: baseY + 1, z: baseZ + pegHeight }
  ];
}

type Triangle = { v1: number; v2: number; v3: number };

function getPegTriangles(baseIdx: number): Triangle[] {
  const base = baseIdx * 8;
  return [
    { v1: base + 0, v2: base + 1, v3: base + 2 },
    { v1: base + 0, v2: base + 2, v3: base + 3 },
    { v1: base + 4, v2: base + 6, v3: base + 5 },
    { v1: base + 4, v2: base + 7, v3: base + 6 },
    { v1: base + 0, v2: base + 4, v3: base + 5 },
    { v1: base + 0, v2: base + 5, v3: base + 1 },
    { v1: base + 1, v2: base + 5, v3: base + 6 },
    { v1: base + 1, v2: base + 6, v3: base + 2 },
    { v1: base + 2, v2: base + 6, v3: base + 7 },
    { v1: base + 2, v2: base + 7, v3: base + 3 },
    { v1: base + 3, v2: base + 7, v3: base + 4 },
    { v1: base + 3, v2: base + 4, v3: base + 0 }
  ];
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
