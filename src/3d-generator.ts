import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import JSZip from "jszip";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const modelXml = build3MFModel(image, settings);
    
    // 3MF is a ZIP archive
    const zip = new JSZip();
    
    // Add required files
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file("3D/3dmodel.model", modelXml);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>
</Relationships>`);
    
    const blob = await zip.generateAsync({ type: "blob" });
    downloadFile(blob, `${settings.filename}.3mf`);
}

function build3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Create materials for each color
    partList.forEach((entry, idx) => {
        const hex = colorEntryToHex(entry.target).substring(1); // Remove #
        materials.push(`<basematerials:base name="${entry.target.name}" displaycolor="#${hex}" />`);
    });
    
    const baseMaterialsId = 1;
    let objectId = baseMaterialsId + 1;
    
    // Generate base layer
    const baseVertices: string[] = [];
    const baseTriangles: string[] = [];
    addBox(baseVertices, baseTriangles, 0, 0, 0, width, height, baseHeight);
    
    objects.push(`<object id="${objectId}" type="model">
        <mesh>
            <vertices>${baseVertices.join('\n')}</vertices>
            <triangles>${baseTriangles.join('\n')}</triangles>
        </mesh>
    </object>`);
    objectId++;
    
    // Generate pixel blocks per color
    partList.forEach((entry, colorIdx) => {
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    addBox(colorVertices, colorTriangles, x, y, baseHeight, 1, 1, pixelHeight);
                }
            }
        }
        
        if (colorVertices.length > 0) {
            objects.push(`<object id="${objectId}" type="model" pid="${baseMaterialsId}" pindex="${colorIdx}">
        <mesh>
            <vertices>${colorVertices.join('\n')}</vertices>
            <triangles>${colorTriangles.join('\n')}</triangles>
        </mesh>
    </object>`);
            objectId++;
        }
    });
    
    const buildItems = objects.map((_, idx) => 
        `<item objectid="${baseMaterialsId + 1 + idx}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
    <resources>
        <basematerials:basematerials id="${baseMaterialsId}">
            ${materials.join('\n')}
        </basematerials:basematerials>
        ${objects.join('\n')}
    </resources>
    <build>
        ${buildItems}
    </build>
</model>`;
}

function addBox(
    vertices: string[],
    triangles: string[],
    x: number, y: number, z: number,
    w: number, h: number, d: number
): void {
    const baseIdx = vertices.length;
    
    // Add 8 vertices for the box
    vertices.push(
        `<vertex x="${x}" y="${y}" z="${z}" />`,
        `<vertex x="${x + w}" y="${y}" z="${z}" />`,
        `<vertex x="${x + w}" y="${y + h}" z="${z}" />`,
        `<vertex x="${x}" y="${y + h}" z="${z}" />`,
        `<vertex x="${x}" y="${y}" z="${z + d}" />`,
        `<vertex x="${x + w}" y="${y}" z="${z + d}" />`,
        `<vertex x="${x + w}" y="${y + h}" z="${z + d}" />`,
        `<vertex x="${x}" y="${y + h}" z="${z + d}" />`
    );
    
    // Add 12 triangles (2 per face, 6 faces)
    const v = baseIdx;
    triangles.push(
        // Bottom face (z=0)
        `<triangle v1="${v}" v2="${v + 2}" v3="${v + 1}" />`,
        `<triangle v1="${v}" v2="${v + 3}" v3="${v + 2}" />`,
        // Top face (z=d)
        `<triangle v1="${v + 4}" v2="${v + 5}" v3="${v + 6}" />`,
        `<triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 7}" />`,
        // Front face (y=0)
        `<triangle v1="${v}" v2="${v + 1}" v3="${v + 5}" />`,
        `<triangle v1="${v}" v2="${v + 5}" v3="${v + 4}" />`,
        // Back face (y=h)
        `<triangle v1="${v + 2}" v2="${v + 3}" v3="${v + 7}" />`,
        `<triangle v1="${v + 2}" v2="${v + 7}" v3="${v + 6}" />`,
        // Left face (x=0)
        `<triangle v1="${v + 3}" v2="${v}" v3="${v + 4}" />`,
        `<triangle v1="${v + 3}" v2="${v + 4}" v3="${v + 7}" />`,
        // Right face (x=w)
        `<triangle v1="${v + 1}" v2="${v + 2}" v3="${v + 6}" />`,
        `<triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 5}" />`
    );
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    const { width, height, pixels, partList } = image;
    const { pixelHeight } = settings;
    
    // Generate one B&W image per color
    partList.forEach((entry, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = '#000000';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG and add to zip
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const safeName = entry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${safeName}_${entry.symbol}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, pixelHeight);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(blob, `${settings.filename}.zip`);
}

function generateOpenSCADFile(image: PartListImage, pixelHeight: number): string {
    const { width, height, partList } = image;
    
    const layers = partList.map((entry, idx) => {
        const safeName = entry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hex = colorEntryToHex(entry.target);
        return `// ${entry.target.name} (${entry.symbol})
color("${hex}")
    surface(file = "${safeName}_${entry.symbol}.png", center = true, invert = true)
    scale([1, 1, ${pixelHeight}]);`;
    }).join('\n\n');
    
    return `// Generated by firaga.io
// Image dimensions: ${width}x${height}

union() {
${layers}
}`;
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
