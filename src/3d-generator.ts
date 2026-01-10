import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export async function generate3MF(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create 3D model XML
    const modelXml = create3MFModel(image);
    zip.file("3D/3dmodel.model", modelXml);
    
    // Create content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // Create relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0"/>
</Relationships>`;
    zip.file("_rels/.rels", rels);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}.3mf`);
}

export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create a mask image for each color
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const maskImage = await createMaskImage(image, i);
        zip.file(`mask_${i}_${sanitizeFilename(part.target.name)}.png`, maskImage);
    }
    
    // Create OpenSCAD file
    const scadContent = createOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${filename}_openscad.zip`);
}

function create3MFModel(image: PartListImage): string {
    const height = 2.0; // Height of each pixel in 3D
    const pixelSize = 1.0; // Size of each pixel
    
    let meshes = '';
    let objectId = 1;
    let components = '';
    
    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate vertices and triangles for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const baseIdx = vertexCount;
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices of the box
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}"/>`);
                    // Top face
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}"/>`);
                    // Front face
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}"/>`);
                    // Back face
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+3}" v3="${baseIdx+7}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+6}"/>`);
                    // Left face
                    triangles.push(`<triangle v1="${baseIdx+3}" v2="${baseIdx+0}" v3="${baseIdx+4}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+3}" v2="${baseIdx+4}" v3="${baseIdx+7}"/>`);
                    // Right face
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}"/>`);
                    triangles.push(`<triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}"/>`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const hex = colorEntryToHex(part.target).substring(1); // Remove #
            meshes += `  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n')}
      </vertices>
      <triangles>
${triangles.join('\n')}
      </triangles>
    </mesh>
  </object>
`;
            components += `    <component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
`;
            objectId++;
        }
    }
    
    const buildObject = `  <object id="${objectId}" type="model">
    <components>
${components}
    </components>
  </object>
`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${meshes}${buildObject}
  </resources>
  <build>
    <item objectid="${objectId}"/>
  </build>
</model>`;
}

function createMaskImage(image: PartListImage, colorIndex: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    // Create black and white image
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
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to blob
    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
}

function createOpenSCADFile(image: PartListImage): string {
    let scadContent = `// Generated OpenSCAD file for image rendering
// Image dimensions: ${image.width} x ${image.height}

pixel_size = 1.0;  // Size of each pixel
height = 2.0;      // Height of the extrusion

`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const part = image.partList[i];
        const colorName = sanitizeFilename(part.target.name);
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadContent += `// ${part.target.name} (${part.count} pixels)
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([pixel_size, pixel_size, height])
  surface(file = "mask_${i}_${colorName}.png", center = false, invert = true);

`;
    }
    
    return scadContent;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
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
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
