import { PartListImage } from "./image-utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    height: number; // Height per layer in mm
    baseThickness: number; // Thickness of base layer in mm
    filename: string;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else {
        await loadJSZipAnd(() => makeOpenSCADMasks(image, settings));
    }
}

async function loadJSZipAnd(func: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            func();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        func();
    }
}

async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with triangle mesh
    const xml = generate3MFContent(image, settings);
    
    // Create a blob and download
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height } = image;
    const pixelSize = 1; // 1mm per pixel
    const layerHeight = settings.height;
    const baseThickness = settings.baseThickness;
    
    let vertexId = 1;
    let triangleId = 1;
    let objectId = 1;
    
    const objects: string[] = [];
    const resources: string[] = [];
    const materials: string[] = [];
    const buildItems: string[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = (color.r / 255).toFixed(6);
        const g = (color.g / 255).toFixed(6);
        const b = (color.b / 255).toFixed(6);
        materials.push(`    <basematerials id="${idx + 1}">
      <base name="${color.name}" displaycolor="#${rgbToHex(color.r, color.g, color.b)}" />
    </basematerials>`);
    });
    
    // Create mesh for each color
    image.partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;
        const vertexMap = new Map<string, number>();
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseThickness;
                    const z1 = baseThickness + layerHeight;
                    
                    // 8 vertices of the box
                    const boxVertices = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];
                    
                    const vIndices: number[] = [];
                    for (const v of boxVertices) {
                        const key = `${v[0]},${v[1]},${v[2]}`;
                        if (!vertexMap.has(key)) {
                            vertices.push(`      <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
                            vertexMap.set(key, localVertexId);
                            vIndices.push(localVertexId);
                            localVertexId++;
                        } else {
                            vIndices.push(vertexMap.get(key)!);
                        }
                    }
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push(`      <triangle v1="${vIndices[0]}" v2="${vIndices[2]}" v3="${vIndices[1]}" />`);
                    triangles.push(`      <triangle v1="${vIndices[0]}" v2="${vIndices[3]}" v3="${vIndices[2]}" />`);
                    // Top
                    triangles.push(`      <triangle v1="${vIndices[4]}" v2="${vIndices[5]}" v3="${vIndices[6]}" />`);
                    triangles.push(`      <triangle v1="${vIndices[4]}" v2="${vIndices[6]}" v3="${vIndices[7]}" />`);
                    // Front
                    triangles.push(`      <triangle v1="${vIndices[0]}" v2="${vIndices[1]}" v3="${vIndices[5]}" />`);
                    triangles.push(`      <triangle v1="${vIndices[0]}" v2="${vIndices[5]}" v3="${vIndices[4]}" />`);
                    // Back
                    triangles.push(`      <triangle v1="${vIndices[2]}" v2="${vIndices[3]}" v3="${vIndices[7]}" />`);
                    triangles.push(`      <triangle v1="${vIndices[2]}" v2="${vIndices[7]}" v3="${vIndices[6]}" />`);
                    // Left
                    triangles.push(`      <triangle v1="${vIndices[3]}" v2="${vIndices[0]}" v3="${vIndices[4]}" />`);
                    triangles.push(`      <triangle v1="${vIndices[3]}" v2="${vIndices[4]}" v3="${vIndices[7]}" />`);
                    // Right
                    triangles.push(`      <triangle v1="${vIndices[1]}" v2="${vIndices[2]}" v3="${vIndices[6]}" />`);
                    triangles.push(`      <triangle v1="${vIndices[1]}" v2="${vIndices[6]}" v3="${vIndices[5]}" />`);
                }
            }
        }
        
        if (vertices.length > 0) {
            const objId = objectId++;
            objects.push(`  <object id="${objId}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
            buildItems.push(`    <item objectid="${objId}" />`);
        }
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials.join('\n')}
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;
}

async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    const pixelSize = 1; // 1mm per pixel
    
    // Create one monochrome image per color
    const imagePromises = image.partList.map(async (part, partIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
        });
        
        const colorName = sanitizeFilename(part.target.name);
        zip.file(`mask_${partIdx}_${colorName}.png`, blob);
        
        return { index: partIdx, name: colorName, filename: `mask_${partIdx}_${colorName}.png` };
    });
    
    const maskInfo = await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, maskInfo, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, `${settings.filename}.zip`);
}

function generateOpenSCADFile(
    image: PartListImage, 
    maskInfo: Array<{ index: number; name: string; filename: string }>,
    settings: ThreeDSettings
): string {
    const pixelSize = 1;
    const layerHeight = settings.height;
    const baseThickness = settings.baseThickness;
    
    let scad = `// OpenSCAD file for ${settings.filename}
// Generated by firaga.io

// Parameters
pixel_size = ${pixelSize}; // mm per pixel
layer_height = ${layerHeight}; // mm
base_thickness = ${baseThickness}; // mm
image_width = ${image.width};
image_height = ${image.height};

`;
    
    // Add each color layer
    maskInfo.forEach((mask, idx) => {
        const color = image.partList[mask.index].target;
        const r = (color.r / 255).toFixed(3);
        const g = (color.g / 255).toFixed(3);
        const b = (color.b / 255).toFixed(3);
        
        scad += `// Layer ${idx}: ${mask.name}
color([${r}, ${g}, ${b}])
translate([0, 0, base_thickness])
scale([pixel_size, pixel_size, layer_height])
surface(file = "${mask.filename}", center = true, invert = true);

`;
    });
    
    scad += `// Combine all layers
union() {
`;
    
    maskInfo.forEach((mask, idx) => {
        scad += `    children(${idx});\n`;
    });
    
    scad += `}\n`;
    
    return scad;
}

function rgbToHex(r: number, g: number, b: number): string {
    return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
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
