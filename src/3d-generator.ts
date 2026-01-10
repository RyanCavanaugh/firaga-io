import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: typeof import("jszip");
declare const saveAs: typeof import("file-saver").saveAs;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    await loadJSZip();
    
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function loadJSZip(): Promise<void> {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag1 = document.createElement("script");
            tag1.id = tagName;
            tag1.onload = () => resolve();
            tag1.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag1);
        });
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Create 3MF structure
    const modelContent = create3MFModel(image, settings);
    const relsContent = create3MFRels();
    const contentTypesContent = create3MFContentTypes();
    
    zip.file("3D/3dmodel.model", modelContent);
    zip.file("_rels/.rels", relsContent);
    zip.file("[Content_Types].xml", contentTypesContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFModel(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `      <base name="${escapeXml(part.target.name)}" displaycolor="${hex}" />\n`;
    });
    
    xml += `    </basematerials>\n`;
    
    // Create mesh objects for each color
    image.partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate vertices and triangles for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = height;
                    
                    // 8 vertices for a cube
                    const baseIdx = vertexCount;
                    vertices.push(
                        `      <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    
                    // 12 triangles for a cube (2 per face)
                    triangles.push(
                        // Bottom face
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`,
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`,
                        // Top face
                        `      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`,
                        `      <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`,
                        // Front face
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`,
                        `      <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`,
                        // Back face
                        `      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`,
                        `      <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`,
                        // Left face
                        `      <triangle v1="${baseIdx + 3}" v2="${baseIdx}" v3="${baseIdx + 4}" />`,
                        `      <triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`,
                        // Right face
                        `      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`,
                        `      <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`
                    );
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `    <object id="${partIdx + 2}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>\n`;
        }
    });
    
    xml += `  </resources>
  <build>
`;
    
    // Add build items for each mesh
    image.partList.forEach((part, partIdx) => {
        // Check if this color has any pixels
        let hasPixels = false;
        for (let y = 0; y < image.height && !hasPixels; y++) {
            for (let x = 0; x < image.width && !hasPixels; x++) {
                if (image.pixels[y][x] === partIdx) {
                    hasPixels = true;
                }
            }
        }
        
        if (hasPixels) {
            xml += `    <item objectid="${partIdx + 2}" partnumber="${escapeXml(part.target.name)}" />\n`;
        }
    });
    
    xml += `  </build>
</model>`;
    
    return xml;
}

function create3MFRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

function create3MFContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    
    // Create one black/white image per color
    image.partList.forEach((part, partIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
            // Fill with white
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, image.width, image.height);
            
            // Mark pixels of this color as black
            ctx.fillStyle = "#000000";
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[y][x] === partIdx) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            
            // Convert to PNG and add to zip
            const dataURL = canvas.toDataURL("image/png");
            const base64Data = dataURL.split(",")[1];
            zip.file(`mask_${partIdx}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
        }
    });
    
    // Create OpenSCAD file
    const scadContent = createOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function createOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { pitch, height } = settings;
    
    let scad = `// Generated OpenSCAD file for ${settings.filename}
// Each color layer is represented by a heightmap from a mask image

`;
    
    image.partList.forEach((part, partIdx) => {
        const hex = colorEntryToHex(part.target);
        const filename = `mask_${partIdx}_${sanitizeFilename(part.target.name)}.png`;
        
        scad += `// ${part.target.name} (${hex})
color("${hex}")
translate([0, 0, ${partIdx * height}])
surface(file = "${filename}", center = true, invert = true, convexity = 5)
  scale([${pitch}, ${pitch}, ${height}]);

`;
    });
    
    return scad;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
