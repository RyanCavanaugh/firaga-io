import { PartListImage } from "./image-utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface Export3DSettings {
    format: "3mf" | "openscad";
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else if (settings.format === "openscad") {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    // 3MF requires specific folder structure
    // Add [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Add _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
    zip.folder("_rels")!.file(".rels", rels);
    
    // Add 3D/3dmodel.model
    const modelXml = generate3MFContent(image, settings);
    zip.folder("3D")!.file("3dmodel.model", modelXml);
    
    // Generate and download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { pixelWidth, pixelHeight, pixelDepth } = settings;
    
    let vertexId = 0;
    let triangleId = 0;
    const vertices: string[] = [];
    const triangles: string[] = [];
    const objects: string[] = [];
    
    // Generate a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        const startVertexId = vertexId;
        
        // Create voxels for each pixel of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube (voxel) for this pixel
                    const baseX = x * pixelWidth;
                    const baseY = y * pixelHeight;
                    const baseZ = 0;
                    
                    // 8 vertices of the cube
                    const v = [
                        [baseX, baseY, baseZ],
                        [baseX + pixelWidth, baseY, baseZ],
                        [baseX + pixelWidth, baseY + pixelHeight, baseZ],
                        [baseX, baseY + pixelHeight, baseZ],
                        [baseX, baseY, baseZ + pixelDepth],
                        [baseX + pixelWidth, baseY, baseZ + pixelDepth],
                        [baseX + pixelWidth, baseY + pixelHeight, baseZ + pixelDepth],
                        [baseX, baseY + pixelHeight, baseZ + pixelDepth]
                    ];
                    
                    const localStartId = vertexId - startVertexId;
                    v.forEach(coord => {
                        colorVertices.push(`<vertex x="${coord[0]}" y="${coord[1]}" z="${coord[2]}" />`);
                        vertexId++;
                    });
                    
                    // 12 triangles (2 per face, 6 faces)
                    const faces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [2, 6, 7], [2, 7, 3], // back
                        [0, 3, 7], [0, 7, 4], // left
                        [1, 5, 6], [1, 6, 2]  // right
                    ];
                    
                    faces.forEach(face => {
                        colorTriangles.push(`<triangle v1="${localStartId + face[0]}" v2="${localStartId + face[1]}" v3="${localStartId + face[2]}" />`);
                    });
                }
            }
        }
        
        if (colorVertices.length > 0) {
            // Create object for this color
            const r = color.target.r;
            const g = color.target.g;
            const b = color.target.b;
            const colorHex = rgbToHex(r, g, b);
            
            objects.push(`  <object id="${colorIndex + 1}" name="${color.target.name}" type="model">
    <mesh>
      <vertices>
${colorVertices.map(v => '        ' + v).join('\n')}
      </vertices>
      <triangles>
${colorTriangles.map(t => '        ' + t).join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    }
    
    // Build 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;
    
    return xml;
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const zip = new JSZip();
    
    // Generate one PNG per color
    const imagePromises: Promise<void>[] = [];
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob and add to zip
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const filename = `color_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
                    zip.file(filename, blob);
                }
                resolve();
            });
        });
        imagePromises.push(promise);
    }
    
    await Promise.all(imagePromises);
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADContent(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADContent(image: PartListImage, settings: Export3DSettings): string {
    const { pixelWidth, pixelHeight, pixelDepth } = settings;
    
    let scadCode = `// Generated OpenSCAD file for ${settings.filename}
// Image dimensions: ${image.width} x ${image.height}

`;
    
    // Add each color layer
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const filename = `color_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        scadCode += `// ${color.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIndex * pixelDepth}])
scale([${pixelWidth}, ${pixelHeight}, ${pixelDepth}])
surface(file = "${filename}", center = false, invert = true);

`;
    }
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
