import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    filename: string;
    gridSize: readonly [number, number];
    pitch: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const pixelHeight = 1.0;
    const baseHeight = 0.5;
    
    let objectId = 1;
    const objects: string[] = [];
    const buildItems: string[] = [];
    const resources: string[] = [];
    
    // Create material for each color
    const materials: string[] = [];
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        materials.push(`    <m:color color="#${hex}FF" />`);
    });
    
    const baseMeshData = generateBaseMesh(image, baseHeight, settings.pitch);
    objects.push(createMeshObject(objectId, baseMeshData.vertices, baseMeshData.triangles));
    buildItems.push(`  <item objectid="${objectId}" />`);
    objectId++;
    
    // Generate mesh for each color
    image.partList.forEach((part, partIndex) => {
        const meshData = generateColorMesh(image, partIndex, pixelHeight, baseHeight, settings.pitch);
        if (meshData.triangles.length > 0) {
            objects.push(createMeshObject(objectId, meshData.vertices, meshData.triangles, partIndex));
            buildItems.push(`  <item objectid="${objectId}" />`);
            objectId++;
        }
    });
    
    const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <m:colorgroup id="1">
${materials.join('\n')}
    </m:colorgroup>
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
    
    const blob = new Blob([model], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

type MeshData = {
    vertices: Array<readonly [number, number, number]>;
    triangles: Array<readonly [number, number, number]>;
};

function generateBaseMesh(image: PartListImage, baseHeight: number, pitch: number): MeshData {
    const vertices: Array<readonly [number, number, number]> = [];
    const triangles: Array<readonly [number, number, number]> = [];
    
    const width = image.width * pitch;
    const height = image.height * pitch;
    
    // Base rectangle
    vertices.push([0, 0, 0]);
    vertices.push([width, 0, 0]);
    vertices.push([width, height, 0]);
    vertices.push([0, height, 0]);
    
    vertices.push([0, 0, baseHeight]);
    vertices.push([width, 0, baseHeight]);
    vertices.push([width, height, baseHeight]);
    vertices.push([0, height, baseHeight]);
    
    // Bottom face
    triangles.push([0, 2, 1]);
    triangles.push([0, 3, 2]);
    
    // Top face
    triangles.push([4, 5, 6]);
    triangles.push([4, 6, 7]);
    
    // Side faces
    triangles.push([0, 1, 5]); triangles.push([0, 5, 4]);
    triangles.push([1, 2, 6]); triangles.push([1, 6, 5]);
    triangles.push([2, 3, 7]); triangles.push([2, 7, 6]);
    triangles.push([3, 0, 4]); triangles.push([3, 4, 7]);
    
    return { vertices, triangles };
}

function generateColorMesh(
    image: PartListImage,
    partIndex: number,
    pixelHeight: number,
    baseHeight: number,
    pitch: number
): MeshData {
    const vertices: Array<readonly [number, number, number]> = [];
    const triangles: Array<readonly [number, number, number]> = [];
    
    let vertexIndex = 0;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === partIndex) {
                const x0 = x * pitch;
                const y0 = y * pitch;
                const x1 = (x + 1) * pitch;
                const y1 = (y + 1) * pitch;
                const z0 = baseHeight;
                const z1 = baseHeight + pixelHeight;
                
                const base = vertexIndex;
                
                // 8 vertices for a cube
                vertices.push([x0, y0, z0]);
                vertices.push([x1, y0, z0]);
                vertices.push([x1, y1, z0]);
                vertices.push([x0, y1, z0]);
                vertices.push([x0, y0, z1]);
                vertices.push([x1, y0, z1]);
                vertices.push([x1, y1, z1]);
                vertices.push([x0, y1, z1]);
                
                // Bottom face
                triangles.push([base + 0, base + 2, base + 1]);
                triangles.push([base + 0, base + 3, base + 2]);
                
                // Top face
                triangles.push([base + 4, base + 5, base + 6]);
                triangles.push([base + 4, base + 6, base + 7]);
                
                // Side faces
                triangles.push([base + 0, base + 1, base + 5]);
                triangles.push([base + 0, base + 5, base + 4]);
                
                triangles.push([base + 1, base + 2, base + 6]);
                triangles.push([base + 1, base + 6, base + 5]);
                
                triangles.push([base + 2, base + 3, base + 7]);
                triangles.push([base + 2, base + 7, base + 6]);
                
                triangles.push([base + 3, base + 0, base + 4]);
                triangles.push([base + 3, base + 4, base + 7]);
                
                vertexIndex += 8;
            }
        }
    }
    
    return { vertices, triangles };
}

function createMeshObject(
    id: number,
    vertices: ReadonlyArray<readonly [number, number, number]>,
    triangles: ReadonlyArray<readonly [number, number, number]>,
    materialId?: number
): string {
    const vertexStrings = vertices.map(v => `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
    const triangleStrings = triangles.map(t => {
        const pidAttr = materialId !== undefined ? ` pid="1" p1="${materialId}"` : '';
        return `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"${pidAttr} />`;
    });
    
    return `    <object id="${id}" type="model">
      <mesh>
        <vertices>
${vertexStrings.join('\n')}
        </vertices>
        <triangles>
${triangleStrings.join('\n')}
        </triangles>
      </mesh>
    </object>`;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();
    
    // Generate a PNG for each color
    const imageFiles: string[] = [];
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const imageData = generateMaskImage(image, i);
        const blob = await imageToPngBlob(imageData);
        const filename = `color_${i}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
        imageFiles.push(filename);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, imageFiles, settings.pitch);
    zip.file("display.scad", scadContent);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateMaskImage(image: PartListImage, partIndex: number): ImageData {
    const imageData = new ImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const pixel = image.pixels[y][x];
            
            if (pixel === partIndex) {
                // White for this color
                imageData.data[idx] = 255;
                imageData.data[idx + 1] = 255;
                imageData.data[idx + 2] = 255;
                imageData.data[idx + 3] = 255;
            } else {
                // Black/transparent for other colors
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 255;
            }
        }
    }
    
    return imageData;
}

async function imageToPngBlob(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob"));
            }
        }, "image/png");
    });
}

function generateOpenSCADFile(
    image: PartListImage,
    imageFiles: readonly string[],
    pitch: number
): string {
    const pixelHeight = 1.0;
    const baseHeight = 0.5;
    
    const colorModules: string[] = [];
    
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1);
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        colorModules.push(`module color_${idx}() {
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    surface(file="${imageFiles[idx]}", center=false, invert=true);
}`);
    });
    
    const scadContent = `// Generated OpenSCAD file for ${image.width}x${image.height} pixel image
// Pitch: ${pitch}mm

pixel_pitch = ${pitch};
pixel_height = ${pixelHeight};
base_height = ${baseHeight};

// Base plate
color([0.5, 0.5, 0.5])
translate([0, 0, 0])
cube([${image.width * pitch}, ${image.height * pitch}, base_height]);

// Color layers
${colorModules.join('\n\n')}

${image.partList.map((_, idx) => `translate([0, 0, base_height])
scale([pixel_pitch, pixel_pitch, pixel_height])
color_${idx}();`).join('\n\n')}
`;
    
    return scadContent;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
