import { PartListImage } from "./image-utils";

export interface Export3DSettings {
    pitch: number;
    height: number; // Height/depth of each pixel in mm
}

export async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const { width, height, partList, pixels } = image;
    const { pitch, height: pixelHeight } = settings;

    // Create 3MF content
    const modelXml = generate3MFModel(image, settings);
    const contentTypesXml = generateContentTypes();
    const relsXml = generateRels();

    // Create zip file using JSZip-like API
    const zip = await import3DLib();
    
    zip.file("3D/3dmodel.model", modelXml);
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.file("_rels/.rels", relsXml);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "output.3mf");
}

function generate3MFModel(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList, pixels } = image;
    const { pitch, height: pixelHeight } = settings;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">`;

    // Add materials for each color
    partList.forEach((part, idx) => {
        const color = part.target;
        const hex = rgbToHex(color.r, color.g, color.b);
        xml += `\n      <base name="${escapeXml(color.name)}" displaycolor="${hex}" />`;
    });

    xml += `\n    </basematerials>`;

    // Create mesh for each color
    partList.forEach((part, partIdx) => {
        const meshData = generateMeshForColor(image, partIdx, settings);
        if (meshData.vertexCount > 0) {
            xml += `\n    <object id="${partIdx + 2}" type="model">
      <mesh>
        <vertices>`;
            
            xml += meshData.vertices;
            
            xml += `\n        </vertices>
        <triangles>`;
            
            xml += meshData.triangles;
            
            xml += `\n        </triangles>
      </mesh>
    </object>`;
        }
    });

    xml += `\n  </resources>
  <build>`;

    // Add build items for each object
    partList.forEach((part, partIdx) => {
        xml += `\n    <item objectid="${partIdx + 2}" />`;
    });

    xml += `\n  </build>
</model>`;

    return xml;
}

function generateMeshForColor(image: PartListImage, colorIndex: number, settings: Export3DSettings) {
    const { pitch, height: pixelHeight } = settings;
    let vertices = "";
    let triangles = "";
    let vertexCount = 0;
    const vertexMap = new Map<string, number>();

    const getVertex = (x: number, y: number, z: number): number => {
        const key = `${x},${y},${z}`;
        if (vertexMap.has(key)) {
            return vertexMap.get(key)!;
        }
        const idx = vertexCount++;
        vertexMap.set(key, idx);
        vertices += `\n          <vertex x="${x}" y="${y}" z="${z}" />`;
        return idx;
    };

    // Generate mesh for pixels of this color
    for (let py = 0; py < image.height; py++) {
        for (let px = 0; px < image.width; px++) {
            if (image.pixels[py][px] === colorIndex) {
                // Create a box for this pixel
                const x0 = px * pitch;
                const x1 = (px + 1) * pitch;
                const y0 = py * pitch;
                const y1 = (py + 1) * pitch;
                const z0 = 0;
                const z1 = pixelHeight;

                // 8 vertices of the box
                const v000 = getVertex(x0, y0, z0);
                const v001 = getVertex(x0, y0, z1);
                const v010 = getVertex(x0, y1, z0);
                const v011 = getVertex(x0, y1, z1);
                const v100 = getVertex(x1, y0, z0);
                const v101 = getVertex(x1, y0, z1);
                const v110 = getVertex(x1, y1, z0);
                const v111 = getVertex(x1, y1, z1);

                // 12 triangles (2 per face, 6 faces)
                // Bottom (z=0)
                triangles += `\n          <triangle v1="${v000}" v2="${v100}" v3="${v110}" />`;
                triangles += `\n          <triangle v1="${v000}" v2="${v110}" v3="${v010}" />`;
                // Top (z=z1)
                triangles += `\n          <triangle v1="${v001}" v2="${v111}" v3="${v101}" />`;
                triangles += `\n          <triangle v1="${v001}" v2="${v011}" v3="${v111}" />`;
                // Front (y=y0)
                triangles += `\n          <triangle v1="${v000}" v2="${v001}" v3="${v101}" />`;
                triangles += `\n          <triangle v1="${v000}" v2="${v101}" v3="${v100}" />`;
                // Back (y=y1)
                triangles += `\n          <triangle v1="${v010}" v2="${v110}" v3="${v111}" />`;
                triangles += `\n          <triangle v1="${v010}" v2="${v111}" v3="${v011}" />`;
                // Left (x=x0)
                triangles += `\n          <triangle v1="${v000}" v2="${v010}" v3="${v011}" />`;
                triangles += `\n          <triangle v1="${v000}" v2="${v011}" v3="${v001}" />`;
                // Right (x=x1)
                triangles += `\n          <triangle v1="${v100}" v2="${v101}" v3="${v111}" />`;
                triangles += `\n          <triangle v1="${v100}" v2="${v111}" v3="${v110}" />`;
            }
        }
    }

    return { vertices, triangles, vertexCount };
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

async function import3DLib(): Promise<any> {
    // Load JSZip from CDN if needed
    if (!(window as any).JSZip) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load JSZip"));
            document.head.appendChild(script);
        });
    }
    return new (window as any).JSZip();
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
