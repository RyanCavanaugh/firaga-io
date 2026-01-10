import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeMFSettings = {
  pixelHeight: number;
  pixelWidth: number;
  pixelDepth: number;
  filename: string;
};

export function generate3MF(image: PartListImage, settings: ThreeMFSettings): void {
  const xml = build3MFContent(image, settings);
  const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
  downloadBlob(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeMFSettings): string {
  const { width, height, partList, pixels } = image;
  const { pixelWidth, pixelHeight, pixelDepth } = settings;

  let meshId = 1;
  const objects: string[] = [];
  const resources: string[] = [];

  // Create base colors for materials
  partList.forEach((part, index) => {
    const hex = colorEntryToHex(part.target).substring(1); // Remove #
    resources.push(`    <basematerials id="${index + 1}">
      <base name="${escapeXml(part.target.name)}" displaycolor="#${hex}" />
    </basematerials>`);
  });

  // Generate mesh for each color
  partList.forEach((part, partIndex) => {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const triangles: Array<{ v1: number; v2: number; v3: number }> = [];

    // Find all pixels of this color and create cubes
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[y][x] === partIndex) {
          const baseIdx = vertices.length;
          const x0 = x * pixelWidth;
          const x1 = (x + 1) * pixelWidth;
          const y0 = y * pixelHeight;
          const y1 = (y + 1) * pixelHeight;
          const z0 = 0;
          const z1 = pixelDepth;

          // 8 vertices of cube
          vertices.push(
            { x: x0, y: y0, z: z0 }, // 0
            { x: x1, y: y0, z: z0 }, // 1
            { x: x1, y: y1, z: z0 }, // 2
            { x: x0, y: y1, z: z0 }, // 3
            { x: x0, y: y0, z: z1 }, // 4
            { x: x1, y: y0, z: z1 }, // 5
            { x: x1, y: y1, z: z1 }, // 6
            { x: x0, y: y1, z: z1 }  // 7
          );

          // 12 triangles (2 per face * 6 faces)
          const faces = [
            [0, 1, 2], [0, 2, 3], // bottom
            [4, 6, 5], [4, 7, 6], // top
            [0, 4, 5], [0, 5, 1], // front
            [1, 5, 6], [1, 6, 2], // right
            [2, 6, 7], [2, 7, 3], // back
            [3, 7, 4], [3, 4, 0], // left
          ];

          faces.forEach(([a, b, c]) => {
            triangles.push({ v1: baseIdx + a, v2: baseIdx + b, v3: baseIdx + c });
          });
        }
      }
    }

    if (vertices.length > 0) {
      const vertexStr = vertices
        .map((v) => `        <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`)
        .join("\n");
      const triangleStr = triangles
        .map((t) => `        <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`)
        .join("\n");

      objects.push(`    <object id="${meshId}" type="model" materialid="${partIndex + 1}">
      <mesh>
        <vertices>
${vertexStr}
        </vertices>
        <triangles>
${triangleStr}
        </triangles>
      </mesh>
    </object>`);

      meshId++;
    }
  });

  const buildItems = objects
    .map((_, idx) => `      <item objectid="${idx + 1}" />`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join("\n")}
${objects.join("\n")}
    <object id="${meshId}" type="model">
      <components>
${buildItems}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${meshId}" />
  </build>
</model>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
