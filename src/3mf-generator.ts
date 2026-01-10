import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeMFSettings {
    pixelHeight: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base layer in mm
    pitch: number; // Spacing between pixels in mm
}

export async function generate3MF(image: PartListImage, settings: ThreeMFSettings): Promise<Blob> {
    // Generate 3MF file structure
    const files = new Map<string, string>();
    
    // Create [Content_Types].xml
    files.set("[Content_Types].xml", generateContentTypes());
    
    // Create _rels/.rels
    files.set("_rels/.rels", generateRels());
    
    // Create 3D/3dmodel.model
    files.set("3D/3dmodel.model", generate3DModel(image, settings));
    
    // Create the zip file
    return createZipFile(files);
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function generate3DModel(image: PartListImage, settings: ThreeMFSettings): string {
    const { pixelHeight, baseHeight, pitch } = settings;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1); // Remove '#'
        xml += `
            <base name="${part.target.name}" displaycolor="#${color}FF"/>`;
    });
    
    xml += `
        </basematerials>`;
    
    // Add objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Generate mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const z0 = baseHeight;
                    const x1 = x0 + pitch;
                    const y1 = y0 + pitch;
                    const z1 = z0 + pixelHeight;
                    
                    // Add 8 vertices for the box
                    const baseIdx = vertexCount;
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}"/>`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}"/>`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}"/>`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}"/>`
                    );
                    
                    // Add 12 triangles for the box (2 per face)
                    // Bottom
                    triangles.push(
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+2}" v3="${baseIdx+1}"/>`,
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+3}" v3="${baseIdx+2}"/>`
                    );
                    // Top
                    triangles.push(
                        `<triangle v1="${baseIdx+4}" v2="${baseIdx+5}" v3="${baseIdx+6}"/>`,
                        `<triangle v1="${baseIdx+4}" v2="${baseIdx+6}" v3="${baseIdx+7}"/>`
                    );
                    // Front
                    triangles.push(
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+1}" v3="${baseIdx+5}"/>`,
                        `<triangle v1="${baseIdx+0}" v2="${baseIdx+5}" v3="${baseIdx+4}"/>`
                    );
                    // Back
                    triangles.push(
                        `<triangle v1="${baseIdx+2}" v2="${baseIdx+3}" v3="${baseIdx+7}"/>`,
                        `<triangle v1="${baseIdx+2}" v2="${baseIdx+7}" v3="${baseIdx+6}"/>`
                    );
                    // Left
                    triangles.push(
                        `<triangle v1="${baseIdx+3}" v2="${baseIdx+0}" v3="${baseIdx+4}"/>`,
                        `<triangle v1="${baseIdx+3}" v2="${baseIdx+4}" v3="${baseIdx+7}"/>`
                    );
                    // Right
                    triangles.push(
                        `<triangle v1="${baseIdx+1}" v2="${baseIdx+2}" v3="${baseIdx+6}"/>`,
                        `<triangle v1="${baseIdx+1}" v2="${baseIdx+6}" v3="${baseIdx+5}"/>`
                    );
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            xml += `
        <object id="${colorIdx + 2}" type="model">
            <mesh>
                <vertices>
${vertices.join('\n                    ')}
                </vertices>
                <triangles>
${triangles.join('\n                    ')}
                </triangles>
            </mesh>
        </object>`;
        }
    });
    
    xml += `
    </resources>
    <build>`;
    
    // Add build items for each object with material
    image.partList.forEach((part, colorIdx) => {
        // Check if this color has any pixels
        let hasPixels = false;
        for (let y = 0; y < image.height && !hasPixels; y++) {
            for (let x = 0; x < image.width && !hasPixels; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    hasPixels = true;
                }
            }
        }
        
        if (hasPixels) {
            xml += `
        <item objectid="${colorIdx + 2}" partnumber="${part.target.code || part.target.name}">
            <metadatagroup>
                <metadata name="Title">${part.target.name}</metadata>
            </metadatagroup>
        </item>`;
        }
    });
    
    xml += `
    </build>
</model>`;
    
    return xml;
}

async function createZipFile(files: Map<string, string>): Promise<Blob> {
    // Use JSZip for creating the zip file
    // For now, we'll use a simple implementation that works in the browser
    const JSZip = (window as any).JSZip;
    
    if (!JSZip) {
        // Load JSZip dynamically
        await loadJSZip();
    }
    
    const zip = new (window as any).JSZip();
    
    for (const [path, content] of files.entries()) {
        zip.file(path, content);
    }
    
    return await zip.generateAsync({ type: "blob" });
}

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        document.head.appendChild(script);
    });
}
