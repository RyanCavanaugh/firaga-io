import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel layer in mm
};

/**
 * Generate 3D output from a PartListImage
 */
export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList } = image;
    const pixelSize = 1.0; // 1mm per pixel in XY plane
    const pixelHeight = settings.pixelHeight;

    // Build 3MF XML structure
    let modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
`;

    // Add materials for each color
    const baseMaterialId = 1;
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove # prefix
        modelXML += `    <basematerials id="${baseMaterialId + i}">
      <base name="${escapeXML(color.name)}" displaycolor="#${hexColor}" />
    </basematerials>
`;
    }

    // Generate meshes for each color layer
    let objectId = baseMaterialId + partList.length;
    const componentItems: string[] = [];

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;

        // Build mesh for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = colorIdx * pixelHeight;
                    const z1 = (colorIdx + 1) * pixelHeight;

                    // 8 vertices of the box
                    const v0 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    const v1 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    const v2 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    const v3 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    const v4 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    const v5 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    const v6 = vertexIndex++;
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    const v7 = vertexIndex++;
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`      <triangle v1="${v0}" v2="${v2}" v3="${v1}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v3}" v3="${v2}" />`);
                    // Top face (z1)
                    triangles.push(`      <triangle v1="${v4}" v2="${v5}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v4}" v2="${v6}" v3="${v7}" />`);
                    // Front face (y0)
                    triangles.push(`      <triangle v1="${v0}" v2="${v1}" v3="${v5}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v5}" v3="${v4}" />`);
                    // Back face (y1)
                    triangles.push(`      <triangle v1="${v2}" v2="${v3}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v2}" v2="${v7}" v3="${v6}" />`);
                    // Left face (x0)
                    triangles.push(`      <triangle v1="${v0}" v2="${v4}" v3="${v7}" />`);
                    triangles.push(`      <triangle v1="${v0}" v2="${v7}" v3="${v3}" />`);
                    // Right face (x1)
                    triangles.push(`      <triangle v1="${v1}" v2="${v2}" v3="${v6}" />`);
                    triangles.push(`      <triangle v1="${v1}" v2="${v6}" v3="${v5}" />`);
                }
            }
        }

        // Only add mesh if it has vertices
        if (vertices.length > 0) {
            modelXML += `    <object id="${objectId}" type="model">
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
            componentItems.push(`    <item objectid="${objectId}" partnumber="${escapeXML(partList[colorIdx].target.name)}" />
`);
            objectId++;
        }
    }

    modelXML += `  </resources>
  <build>
${componentItems.join('')}  </build>
</model>`;

    // Create 3MF file (which is a ZIP file with model XML)
    const blob = await createZipBlob({
        "3D/3dmodel.model": modelXML,
        "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`
    });

    downloadBlob(blob, `${settings.filename}.3mf`);
}

/**
 * Generate OpenSCAD masks format (zip with images + .scad file)
 */
async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList } = image;
    const files: Record<string, string> = {};

    // Generate one black/white image per color
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        
        // Clear canvas to white
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG data URL
        const dataURL = canvas.toDataURL("image/png");
        const base64Data = dataURL.split(",")[1];
        
        // Generate safe filename
        const safeName = sanitizeFilename(color.target.name);
        files[`mask_${colorIdx}_${safeName}.png`] = base64Data;
    }

    // Generate OpenSCAD file
    let scadCode = `// Generated by firaga.io
// Image dimensions: ${width}x${height} pixels

pixel_size = 1; // Size of each pixel in mm
layer_height = ${settings.pixelHeight}; // Height of each color layer in mm

`;

    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const safeName = sanitizeFilename(color.target.name);
        const hexColor = colorEntryToHex(color.target);
        
        scadCode += `// Layer ${colorIdx}: ${color.target.name} (${hexColor})
color("${hexColor}")
translate([0, 0, ${colorIdx} * layer_height])
linear_extrude(height = layer_height)
scale([pixel_size, pixel_size, 1])
surface(file = "mask_${colorIdx}_${safeName}.png", center = true, invert = true);

`;
    }

    files["model.scad"] = btoa(scadCode); // Base64 encode

    const blob = await createZipBlob(files);
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

/**
 * Create a ZIP blob from files (uses JSZip-like structure manually)
 */
async function createZipBlob(files: Record<string, string>): Promise<Blob> {
    // For simplicity, we'll use a library if available, or implement basic ZIP
    // Since this is a minimal implementation, we'll use dynamic import
    
    // Simple implementation: Load JSZip from CDN
    const JSZip = await loadJSZip();
    
    const zip = new JSZip();
    for (const [filename, content] of Object.entries(files)) {
        if (filename.endsWith(".png")) {
            // PNG files are base64 encoded
            zip.file(filename, content, { base64: true });
        } else {
            // Text files
            zip.file(filename, content);
        }
    }
    
    return await zip.generateAsync({ type: "blob" });
}

/**
 * Load JSZip library dynamically
 */
async function loadJSZip(): Promise<any> {
    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById("jszip-script");
        if ((window as any).JSZip) {
            resolve((window as any).JSZip);
            return;
        }
        
        if (existingScript) {
            existingScript.addEventListener("load", () => {
                resolve((window as any).JSZip);
            });
            return;
        }
        
        const script = document.createElement("script");
        script.id = "jszip-script";
        script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        document.head.appendChild(script);
    });
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Sanitize filename by removing special characters
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
