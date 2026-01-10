import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
    pitch: number;
    height: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const xml = build3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    const meshes: string[] = [];
    
    // Generate a separate mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // Add 8 vertices for a cube
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 2]);
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 3]);
                    // Top face (z=height)
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 5]);
                    triangles.push([baseIdx + 4, baseIdx + 7, baseIdx + 6]);
                    // Front face (y=y0)
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 4, baseIdx + 5]);
                    // Back face (y=y1)
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 3]);
                    triangles.push([baseIdx + 2, baseIdx + 6, baseIdx + 7]);
                    // Left face (x=x0)
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 0, baseIdx + 7, baseIdx + 4]);
                    // Right face (x=x1)
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 2]);
                    triangles.push([baseIdx + 1, baseIdx + 5, baseIdx + 6]);
                }
            }
        }
        
        if (vertices.length > 0) {
            const vertexStr = vertices.map(v => `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`).join('\n      ');
            const triangleStr = triangles.map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`).join('\n      ');
            
            meshes.push(`
    <object id="${colorIdx + 1}" type="model">
      <mesh>
        <vertices>
      ${vertexStr}
        </vertices>
        <triangles>
      ${triangleStr}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    const colorResources = image.partList.map((entry, idx) => {
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `    <basematerials id="material_${idx + 1}">
      <base name="${entry.target.name}" displaycolor="#${hex.slice(1)}" />
    </basematerials>`;
    }).join('\n');
    
    const buildItems = image.partList.map((_, idx) => 
        `    <item objectid="${idx + 1}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${colorResources}
${meshes.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import("jszip" as any)).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();
    
    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const maskData = generateMaskImage(image, colorIdx);
        zip.file(`mask_${colorIdx}.png`, maskData.split(',')[1], { base64: true });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function generateMaskImage(image: PartListImage, colorIdx: number): string {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIdx;
            const value = isColor ? 255 : 0;
            
            imageData.data[idx + 0] = value; // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    const scaleX = pitch;
    const scaleY = pitch;
    
    let content = `// Generated by firaga.io
// OpenSCAD file for 3D pixel art
// Each color is loaded as a heightmap and combined

`;
    
    // Add modules for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const hex = colorEntryToHex(entry.target);
        
        content += `
module color_${colorIdx}() {
    color("${hex}")
    scale([${scaleX}, ${scaleY}, ${height}])
    surface(file = "mask_${colorIdx}.png", center = false, invert = true);
}
`;
    }
    
    // Combine all colors
    content += `
// Combine all colors
union() {
`;
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        content += `    color_${colorIdx}();\n`;
    }
    
    content += `}
`;
    
    return content;
}
