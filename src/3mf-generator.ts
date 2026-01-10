import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

// JSZip will be loaded dynamically from CDN
declare const JSZip: any;

export interface ThreeDSettings {
  pixelHeight: number;
  baseHeight: number;
}

/**
 * Generate a 3MF file containing a triangle mesh with separate material shapes for each color
 */
export async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
  await loadJSZip();
  const xml = build3MFContent(image, settings, filename);
  
  // 3MF is a ZIP container with specific structure
  const zip = new JSZip();
  zip.file("3D/3dmodel.model", xml);
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeDSettings, filename: string): string {
  const { pixelHeight, baseHeight } = settings;
  
  // Build the materials section
  const materials = image.partList.map((part, idx) => {
    const r = part.target.r;
    const g = part.target.g;
    const b = part.target.b;
    const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return `    <base:material id="${idx + 1}" name="${escapeXml(part.target.name)}" color="${color}" />`;
  }).join('\n');

  // Build meshes for each color
  const meshes = image.partList.map((part, materialIdx) => {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexIdx = 0;

    // Collect all pixels of this color
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        if (image.pixels[y][x] === materialIdx) {
          // Create a voxel at position (x, y)
          const voxelData = createVoxel(x, y, pixelHeight, baseHeight);
          vertices.push(...voxelData.vertices);
          triangles.push(...voxelData.triangles.map(tri => {
            const [v1, v2, v3] = tri.split(' ').map(Number);
            return `      <triangle v1="${v1 + vertexIdx}" v2="${v2 + vertexIdx}" v3="${v3 + vertexIdx}" pid="${materialIdx + 1}" />`;
          }));
          vertexIdx += 8; // 8 vertices per voxel
        }
      }
    }

    if (vertices.length === 0) return '';

    return `    <object id="${materialIdx + 2}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
  }).filter(Boolean).join('\n');

  const objects = image.partList.map((_, idx) => 
    `      <component objectid="${idx + 2}" />`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(filename)}</metadata>
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${materials}
    </basematerials>
${meshes}
    <object id="9999" type="model">
      <components>
${objects}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="9999" />
  </build>
</model>`;
}

interface VoxelGeometry {
  vertices: string[];
  triangles: string[];
}

function createVoxel(x: number, y: number, height: number, baseHeight: number): VoxelGeometry {
  const x0 = x;
  const x1 = x + 1;
  const y0 = y;
  const y1 = y + 1;
  const z0 = baseHeight;
  const z1 = baseHeight + height;

  // 8 vertices of a box
  const vertices = [
    `          <vertex x="${x0}" y="${y0}" z="${z0}" />`,
    `          <vertex x="${x1}" y="${y0}" z="${z0}" />`,
    `          <vertex x="${x1}" y="${y1}" z="${z0}" />`,
    `          <vertex x="${x0}" y="${y1}" z="${z0}" />`,
    `          <vertex x="${x0}" y="${y0}" z="${z1}" />`,
    `          <vertex x="${x1}" y="${y0}" z="${z1}" />`,
    `          <vertex x="${x1}" y="${y1}" z="${z1}" />`,
    `          <vertex x="${x0}" y="${y1}" z="${z1}" />`
  ];

  // 12 triangles (2 per face, 6 faces)
  const triangles = [
    // Bottom face (z0)
    '0 2 1', '0 3 2',
    // Top face (z1)
    '4 5 6', '4 6 7',
    // Front face (y0)
    '0 1 5', '0 5 4',
    // Back face (y1)
    '2 3 7', '2 7 6',
    // Left face (x0)
    '0 4 7', '0 7 3',
    // Right face (x1)
    '1 2 6', '1 6 5'
  ];

  return { vertices, triangles };
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0').toUpperCase();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function loadJSZip(): Promise<void> {
  const tagName = "jszip-script-tag";
  if (document.getElementById(tagName)) return;

  return new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.id = tagName;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("Failed to load JSZip"));
    tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    document.head.appendChild(tag);
  });
}
