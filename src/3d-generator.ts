import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    pixelHeight: number;
    filename: string;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Import dependencies dynamically
    const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm'),
        import('file-saver')
    ]);
    
    // Build vertex and triangle data for each color
    const pixelSize = 1.0; // 1mm per pixel
    const height = settings.pixelHeight;
    
    let objectsXml = '';
    let materialsXml = '';
    let nextObjectId = 2;
    let nextMaterialId = 1;
    
    // Create a mesh for each color
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        const color = colorEntryToHex(part.target);
        
        // Find all pixels of this color
        const pixels: Array<[number, number]> = [];
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    pixels.push([x, y]);
                }
            }
        }
        
        if (pixels.length === 0) continue;
        
        // Generate mesh for these pixels
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        function getOrAddVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            let idx = vertexMap.get(key);
            if (idx === undefined) {
                idx = vertices.length;
                vertices.push([x, y, z]);
                vertexMap.set(key, idx);
            }
            return idx;
        }
        
        // Create cube for each pixel
        for (const [px, py] of pixels) {
            const x0 = px * pixelSize;
            const x1 = (px + 1) * pixelSize;
            const y0 = py * pixelSize;
            const y1 = (py + 1) * pixelSize;
            const z0 = 0;
            const z1 = height;
            
            // 8 vertices of the cube
            const v000 = getOrAddVertex(x0, y0, z0);
            const v001 = getOrAddVertex(x0, y0, z1);
            const v010 = getOrAddVertex(x0, y1, z0);
            const v011 = getOrAddVertex(x0, y1, z1);
            const v100 = getOrAddVertex(x1, y0, z0);
            const v101 = getOrAddVertex(x1, y0, z1);
            const v110 = getOrAddVertex(x1, y1, z0);
            const v111 = getOrAddVertex(x1, y1, z1);
            
            // 12 triangles (2 per face, 6 faces)
            // Bottom (z=0)
            triangles.push([v000, v100, v110]);
            triangles.push([v000, v110, v010]);
            // Top (z=z1)
            triangles.push([v001, v011, v111]);
            triangles.push([v001, v111, v101]);
            // Front (y=y0)
            triangles.push([v000, v001, v101]);
            triangles.push([v000, v101, v100]);
            // Back (y=y1)
            triangles.push([v010, v110, v111]);
            triangles.push([v010, v111, v011]);
            // Left (x=x0)
            triangles.push([v000, v010, v011]);
            triangles.push([v000, v011, v001]);
            // Right (x=x1)
            triangles.push([v100, v101, v111]);
            triangles.push([v100, v111, v110]);
        }
        
        // Build mesh XML
        let meshXml = `    <mesh>\n      <vertices>\n`;
        for (const [x, y, z] of vertices) {
            meshXml += `        <vertex x="${x}" y="${y}" z="${z}"/>\n`;
        }
        meshXml += `      </vertices>\n      <triangles>\n`;
        for (const [v1, v2, v3] of triangles) {
            meshXml += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${nextMaterialId}"/>\n`;
        }
        meshXml += `      </triangles>\n    </mesh>`;
        
        objectsXml += `  <object id="${nextObjectId}" type="model" name="${part.target.name}">\n${meshXml}\n  </object>\n`;
        
        // Add material
        const rgb = hexToRgb(color);
        materialsXml += `    <base name="${part.target.name}" displaycolor="${rgb}"/>\n`;
        
        nextObjectId++;
        nextMaterialId++;
    }
    
    // Build 3MF file structure
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${settings.filename}</metadata>
  <resources>
    <basematerials id="1">
${materialsXml}    </basematerials>
${objectsXml}    <object id="1" type="model">
      <components>
${Array.from({ length: nextObjectId - 2 }, (_, i) => `        <component objectid="${i + 2}"/>`).join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`;
    
    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    
    // Create ZIP file
    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.folder("_rels")!.file(".rels", relsXml);
    zip.folder("3D")!.file("3dmodel.model", modelXml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    // Import dependencies dynamically
    const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm'),
        import('file-saver')
    ]);
    
    const zip = new JSZip();
    const pixelHeight = settings.pixelHeight;
    
    // Generate one image per color
    const images: string[] = [];
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        
        // Create canvas for this color
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const filename = `color_${partIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, base64Data, { base64: true });
        images.push(filename);
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// ${settings.filename}

`;
    
    for (let i = 0; i < images.length; i++) {
        const part = image.partList[i];
        const color = colorEntryToHex(part.target);
        const rgb = hexToRgbNormalized(color);
        
        scadContent += `// ${part.target.name}
color([${rgb[0]}, ${rgb[1]}, ${rgb[2]}])
  surface(file = "${images[i]}", center = true, invert = true);
  
`;
    }
    
    scadContent += `// Alternative: use linear_extrude for each color mask
// Uncomment and adjust as needed
/*
module pixel_layer(filename, height, color_rgb) {
    color(color_rgb)
    linear_extrude(height = height)
    scale([1, 1, 1])  // Scale as needed
    surface(file = filename, center = true, invert = true);
}

`;
    
    for (let i = 0; i < images.length; i++) {
        const part = image.partList[i];
        const color = colorEntryToHex(part.target);
        const rgb = hexToRgbNormalized(color);
        
        scadContent += `pixel_layer("${images[i]}", ${pixelHeight}, [${rgb[0]}, ${rgb[1]}, ${rgb[2]}]); // ${part.target.name}\n`;
    }
    
    scadContent += `*/\n`;
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "#FFFFFF";
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `#${result[1]}${result[2]}${result[3]}`.toUpperCase();
}

function hexToRgbNormalized(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    return [r, g, b];
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
