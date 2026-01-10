import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export async function export3MF(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create 3MF structure
    const modelXML = generate3MFModel(image);
    
    zip.file("3D/3dmodel.model", modelXML);
    zip.file("[Content_Types].xml", getContentTypesXML());
    zip.file("_rels/.rels", getRelsXML());
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
}

export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Generate one mask image per color
    for (let i = 0; i < image.partList.length; i++) {
        const maskCanvas = createMaskCanvas(image, i);
        const blob = await canvasToBlob(maskCanvas);
        const colorName = image.partList[i].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${i}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

function generate3MFModel(image: PartListImage): string {
    const width = image.width;
    const height = image.height;
    const pixelSize = 2.5; // 2.5mm per pixel (standard bead size)
    const layerHeight = 2.5;
    
    let objectsXML = '';
    let objectId = 1;
    
    // Create a separate mesh object for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx];
        const hexColor = colorEntryToHex(color.target).substring(1); // Remove '#'
        
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Create vertices and triangles for each pixel of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    
                    // Bottom face vertices
                    vertices.push([x0, y0, 0]);
                    vertices.push([x1, y0, 0]);
                    vertices.push([x1, y1, 0]);
                    vertices.push([x0, y1, 0]);
                    
                    // Top face vertices
                    vertices.push([x0, y0, layerHeight]);
                    vertices.push([x1, y0, layerHeight]);
                    vertices.push([x1, y1, layerHeight]);
                    vertices.push([x0, y1, layerHeight]);
                    
                    // Bottom face (2 triangles)
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    
                    // Top face (2 triangles)
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    
                    // Side faces
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                }
            }
        }
        
        if (vertices.length > 0) {
            let verticesXML = '';
            for (const v of vertices) {
                verticesXML += `      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            }
            
            let trianglesXML = '';
            for (const t of triangles) {
                trianglesXML += `      <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />\n`;
            }
            
            objectsXML += `  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
${verticesXML}      </vertices>
      <triangles>
${trianglesXML}      </triangles>
    </mesh>
  </object>
`;
            objectId++;
        }
    }
    
    // Build components
    let componentsXML = '';
    for (let i = 1; i < objectId; i++) {
        componentsXML += `      <component objectid="${i}" />\n`;
    }
    
    const buildItemId = objectId;
    const buildObject = componentsXML.trim().length > 0 ? 
        `  <object id="${buildItemId}" type="model">
    <components>
${componentsXML}    </components>
  </object>\n` : '';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXML}${buildObject}  </resources>
  <build>
    <item objectid="${buildItemId}" />
  </build>
</model>`;
}

function getContentTypesXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function getRelsXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function createMaskCanvas(image: PartListImage, colorIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isThisColor = image.pixels[y][x] === colorIndex;
            const value = isThisColor ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function generateOpenSCADFile(image: PartListImage): string {
    let scadCode = `// Generated OpenSCAD file for pixel art
// Image dimensions: ${image.width}x${image.height}
// Colors: ${image.partList.length}

pixel_size = 2.5; // mm per pixel
layer_height = 2.5; // mm height

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i];
        const colorName = color.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        scadCode += `// ${color.target.name} (${color.count} pixels)
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([pixel_size, pixel_size, layer_height])
    surface(file = "mask_${i}_${colorName}.png", center = false, invert = true);

`;
    }
    
    return scadCode;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        });
    });
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip() {
    return new Promise<void>((resolve, reject) => {
        const tagName = "jszip-script-tag";
        const scriptEl = document.getElementById(tagName);
        if (scriptEl === null) {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error('Failed to load JSZip'));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        } else {
            resolve();
        }
    });
}
