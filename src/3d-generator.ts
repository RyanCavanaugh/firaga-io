import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    height: number; // Height in mm for each pixel
    pixelSize: number; // Size of each pixel in mm
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with triangle meshes for each color
    const xml = generateThreeMFXML(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, "model.3mf");
}

function generateThreeMFXML(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, height } = settings;
    
    // 3MF requires a specific XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
`;

    // Create materials for each color
    xml += `    <basematerials id="1">\n`;
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = rgbToHex(color.r, color.g, color.b);
        xml += `      <base name="${color.name}" displaycolor="${hex}" />\n`;
    }
    xml += `    </basematerials>\n`;

    // Create mesh objects for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        xml += generateMeshForColor(image, colorIndex, pixelSize, height);
    }

    xml += `  </resources>
  <build>
`;

    // Add all objects to build
    for (let i = 0; i < image.partList.length; i++) {
        xml += `    <item objectid="${i + 2}" />\n`;
    }

    xml += `  </build>
</model>`;

    return xml;
}

function generateMeshForColor(image: PartListImage, colorIndex: number, pixelSize: number, height: number): string {
    const vertices: number[][] = [];
    const triangles: number[][] = [];
    
    // Generate vertices and triangles for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIndex) {
                const baseIdx = vertices.length;
                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = 0;
                const z1 = height;

                // Create a box for this pixel
                // Bottom vertices
                vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                // Top vertices
                vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);

                // Bottom face
                triangles.push([baseIdx, baseIdx + 2, baseIdx + 1]);
                triangles.push([baseIdx, baseIdx + 3, baseIdx + 2]);
                
                // Top face
                triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                
                // Front face
                triangles.push([baseIdx, baseIdx + 1, baseIdx + 5]);
                triangles.push([baseIdx, baseIdx + 5, baseIdx + 4]);
                
                // Right face
                triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                
                // Back face
                triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                
                // Left face
                triangles.push([baseIdx + 3, baseIdx, baseIdx + 4]);
                triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
            }
        }
    }

    if (vertices.length === 0) {
        return ""; // No pixels of this color
    }

    let xml = `    <object id="${colorIndex + 2}" type="model">\n`;
    xml += `      <mesh>\n`;
    xml += `        <vertices>\n`;
    
    for (const v of vertices) {
        xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
    }
    
    xml += `        </vertices>\n`;
    xml += `        <triangles>\n`;
    
    for (const t of triangles) {
        xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIndex}" />\n`;
    }
    
    xml += `        </triangles>\n`;
    xml += `      </mesh>\n`;
    xml += `    </object>\n`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    // Generate OpenSCAD masks format (zip file)
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { pixelSize, height } = settings;
    
    // Generate one black/white image per color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const imageData = generateMaskImage(image, colorIndex);
        const blob = await imageToPNG(imageData);
        const colorName = sanitizeFilename(image.partList[colorIndex].target.name);
        zip.file(`mask_${colorIndex}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file("model.scad", scadContent);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "3d-model.zip");
}

function generateMaskImage(image: PartListImage, colorIndex: number): ImageData {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIndex;
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    return imageData;
}

async function imageToPNG(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, "image/png");
    });
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelSize, height } = settings;
    
    let scad = `// Generated 3D model for ${image.width}x${image.height} image
// Pixel size: ${pixelSize}mm, Height: ${height}mm

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const colorName = sanitizeFilename(image.partList[i].target.name);
        const color = image.partList[i].target;
        
        scad += `// Color: ${color.name} (${color.code || "no code"})
color([${color.r / 255}, ${color.g / 255}, ${color.b / 255}])
  surface(file = "mask_${i}_${colorName}.png", center = false, invert = true)
    scale([${pixelSize}, ${pixelSize}, ${height / 255}]);

`;
    }
    
    return scad;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

async function loadJSZip(): Promise<any> {
    // Dynamically load JSZip from CDN
    return new Promise((resolve, reject) => {
        const scriptId = "jszip-script";
        const existingScript = document.getElementById(scriptId);
        
        if (existingScript) {
            resolve((window as any).JSZip);
            return;
        }
        
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
