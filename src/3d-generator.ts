import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const meshes: string[] = [];
    let objectId = 1;

    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        if (!part) continue;

        const vertices: Array<{ x: number; y: number; z: number }> = [];
        const triangles: number[] = [];

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    const baseIdx = vertices.length;
                    const z0 = settings.baseHeight;
                    const z1 = settings.baseHeight + settings.pixelHeight;

                    vertices.push(
                        { x, y, z: z0 },
                        { x: x + 1, y, z: z0 },
                        { x: x + 1, y: y + 1, z: z0 },
                        { x, y: y + 1, z: z0 },
                        { x, y, z: z1 },
                        { x: x + 1, y, z: z1 },
                        { x: x + 1, y: y + 1, z: z1 },
                        { x, y: y + 1, z: z1 }
                    );

                    // Bottom face
                    triangles.push(baseIdx + 0, baseIdx + 2, baseIdx + 1);
                    triangles.push(baseIdx + 0, baseIdx + 3, baseIdx + 2);
                    // Top face
                    triangles.push(baseIdx + 4, baseIdx + 5, baseIdx + 6);
                    triangles.push(baseIdx + 4, baseIdx + 6, baseIdx + 7);
                    // Front face
                    triangles.push(baseIdx + 0, baseIdx + 1, baseIdx + 5);
                    triangles.push(baseIdx + 0, baseIdx + 5, baseIdx + 4);
                    // Right face
                    triangles.push(baseIdx + 1, baseIdx + 2, baseIdx + 6);
                    triangles.push(baseIdx + 1, baseIdx + 6, baseIdx + 5);
                    // Back face
                    triangles.push(baseIdx + 2, baseIdx + 3, baseIdx + 7);
                    triangles.push(baseIdx + 2, baseIdx + 7, baseIdx + 6);
                    // Left face
                    triangles.push(baseIdx + 3, baseIdx + 0, baseIdx + 4);
                    triangles.push(baseIdx + 3, baseIdx + 4, baseIdx + 7);
                }
            }
        }

        if (vertices.length > 0) {
            const vertexXml = vertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}"/>`).join("\n");
            const triangleXml: string[] = [];
            for (let i = 0; i < triangles.length; i += 3) {
                triangleXml.push(`<triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}"/>`);
            }

            const hex = colorEntryToHex(part.target).substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            meshes.push(`
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertexXml}
        </vertices>
        <triangles>
${triangleXml.join("\n")}
        </triangles>
      </mesh>
    </object>
    <basematerials id="material${objectId}">
      <base name="${part.target.name}" displaycolor="#${hex}" />
    </basematerials>`);
            objectId++;
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${meshes.join("\n")}
  </resources>
  <build>
${Array.from({ length: objectId - 1 }, (_, i) => `    <item objectid="${i + 1}" />`).join("\n")}
  </build>
</model>`;

    downloadFile(xml, "model.3mf", "application/vnd.ms-package.3dmanufacturing-3dmodel+xml");
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const scadParts: string[] = [];

    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const part = image.partList[colorIndex];
        if (!part) continue;

        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);

        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const imageData = await new Promise<string>((resolve) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
                reader.readAsDataURL(blob!);
            });
        });

        const filename = `layer_${colorIndex}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, imageData, { base64: true });

        const hex = colorEntryToHex(part.target);
        scadParts.push(`
// ${part.target.name}
color("${hex}")
  translate([0, 0, ${colorIndex * settings.pixelHeight}])
  scale([1, 1, ${settings.pixelHeight}])
  surface(file = "${filename}", center = true, invert = true);
`);
    }

    const scadFile = `// Generated by firaga.io
// 3D representation of pixel art

$fn = 20;

${scadParts.join("\n")}
`;

    zip.file("model.scad", scadFile);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "model.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<typeof import("jszip")> {
    if ((window as any).JSZip) {
        return (window as any).JSZip;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
