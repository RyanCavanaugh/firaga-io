import { PartListImage } from "./image-utils";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    heightPerLayer: number; // in mm
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings);
    }
}

// Generate 3MF file with separate material shapes for each color
async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const xml = build3MFContent(image, settings.heightPerLayer);
    
    const zip = new JSZip();
    
    // Add required 3MF metadata files
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0"/>
</Relationships>`);
    
    zip.folder("3D")!.file("3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, heightPerLayer: number): string {
    const colors = image.partList.map((entry, idx) => ({
        id: idx,
        entry,
        color: entry.target
    }));
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">
`;
    
    // Add materials for each color
    colors.forEach((c, idx) => {
        const r = c.color.r.toString(16).padStart(2, '0');
        const g = c.color.g.toString(16).padStart(2, '0');
        const b = c.color.b.toString(16).padStart(2, '0');
        xml += `            <base name="${c.color.name}" displaycolor="#${r}${g}${b}" />\n`;
    });
    
    xml += `        </basematerials>\n`;
    
    // Create mesh objects for each color
    colors.forEach((c, colorIdx) => {
        const meshData = createMeshForColor(image, c.id, heightPerLayer);
        if (meshData.vertices.length === 0) return;
        
        xml += `        <object id="${colorIdx + 2}" type="model">
            <mesh>
                <vertices>\n`;
        
        meshData.vertices.forEach(v => {
            xml += `                    <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
        });
        
        xml += `                </vertices>
                <triangles>\n`;
        
        meshData.triangles.forEach(t => {
            xml += `                    <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${colorIdx}" />\n`;
        });
        
        xml += `                </triangles>
            </mesh>
        </object>\n`;
    });
    
    xml += `    </resources>
    <build>
`;
    
    // Add all objects to the build
    colors.forEach((c, colorIdx) => {
        xml += `        <item objectid="${colorIdx + 2}" />\n`;
    });
    
    xml += `    </build>
</model>`;
    
    return xml;
}

type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };

function createMeshForColor(image: PartListImage, colorId: number, heightPerLayer: number): { vertices: Vertex[], triangles: Triangle[] } {
    const vertices: Vertex[] = [];
    const triangles: Triangle[] = [];
    const vertexMap = new Map<string, number>();
    
    function addVertex(x: number, y: number, z: number): number {
        const key = `${x},${y},${z}`;
        if (vertexMap.has(key)) {
            return vertexMap.get(key)!;
        }
        const idx = vertices.length;
        vertices.push({ x, y, z });
        vertexMap.set(key, idx);
        return idx;
    }
    
    // Create a cube for each pixel of this color
    for (let py = 0; py < image.height; py++) {
        for (let px = 0; px < image.width; px++) {
            if (image.pixels[py][px] !== colorId) continue;
            
            // Create a 1x1x(heightPerLayer) cube at position (px, py, 0)
            const x0 = px, x1 = px + 1;
            const y0 = py, y1 = py + 1;
            const z0 = 0, z1 = heightPerLayer;
            
            // 8 vertices of the cube
            const v000 = addVertex(x0, y0, z0);
            const v001 = addVertex(x0, y0, z1);
            const v010 = addVertex(x0, y1, z0);
            const v011 = addVertex(x0, y1, z1);
            const v100 = addVertex(x1, y0, z0);
            const v101 = addVertex(x1, y0, z1);
            const v110 = addVertex(x1, y1, z0);
            const v111 = addVertex(x1, y1, z1);
            
            // 12 triangles (2 per face, 6 faces)
            // Bottom face (z = z0)
            triangles.push({ v1: v000, v2: v100, v3: v110 });
            triangles.push({ v1: v000, v2: v110, v3: v010 });
            
            // Top face (z = z1)
            triangles.push({ v1: v001, v2: v011, v3: v111 });
            triangles.push({ v1: v001, v2: v111, v3: v101 });
            
            // Front face (y = y0)
            triangles.push({ v1: v000, v2: v001, v3: v101 });
            triangles.push({ v1: v000, v2: v101, v3: v100 });
            
            // Back face (y = y1)
            triangles.push({ v1: v010, v2: v110, v3: v111 });
            triangles.push({ v1: v010, v2: v111, v3: v011 });
            
            // Left face (x = x0)
            triangles.push({ v1: v000, v2: v010, v3: v011 });
            triangles.push({ v1: v000, v2: v011, v3: v001 });
            
            // Right face (x = x1)
            triangles.push({ v1: v100, v2: v101, v3: v111 });
            triangles.push({ v1: v100, v2: v111, v3: v110 });
        }
    }
    
    return { vertices, triangles };
}

// Generate OpenSCAD masks format (zip with masks and .scad file)
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const zip = new JSZip();
    
    // Create one mask image per color
    const maskPromises = image.partList.map(async (entry, idx) => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.width;
        maskCanvas.height = image.height;
        const ctx = maskCanvas.getContext('2d')!;
        
        // Fill with white (no pixels)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Set black pixels where this color exists
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        return new Promise<{ name: string, blob: Blob, color: string }>((resolve) => {
            maskCanvas.toBlob((blob) => {
                const colorName = entry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({ 
                    name: `mask_${idx}_${colorName}.png`, 
                    blob: blob!,
                    color: entry.target.name
                });
            });
        });
    });
    
    const masks = await Promise.all(maskPromises);
    
    // Add mask images to zip
    masks.forEach(mask => {
        zip.file(mask.name, mask.blob);
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(masks, image.width, image.height, settings.heightPerLayer);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(masks: { name: string, color: string }[], width: number, height: number, heightPerLayer: number): string {
    let scad = `// Generated OpenSCAD file for pixel art
// Image dimensions: ${width}x${height}
// Height per layer: ${heightPerLayer}mm

`;
    
    masks.forEach((mask, idx) => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        
        scad += `// Layer ${idx + 1}: ${mask.color}
color([${r/255}, ${g/255}, ${b/255}])
linear_extrude(height = ${heightPerLayer})
    scale([1, 1, 1])
        surface(file = "${mask.name}", center = true, invert = true);

`;
    });
    
    return scad;
}
