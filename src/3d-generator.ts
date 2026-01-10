import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    height: number; // Height of each pixel in mm
    baseHeight: number; // Height of the base in mm
    pixelSize: number; // Size of each pixel in mm
}

/**
 * Generate 3D output files
 */
export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await make3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await makeOpenSCADMasks(image, settings);
    }
}

/**
 * Generate a 3MF file with separate material shapes for each color
 */
async function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    
    // 3MF is an XML-based format
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Define materials (colors)
    xml += '    <basematerials id="1">\n';
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i].target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        xml += `      <base name="${color.name}" displaycolor="#${hexColor}" />\n`;
    }
    xml += '    </basematerials>\n';
    
    // Generate meshes for each color
    let objectId = 2;
    const objectIds: number[] = [];
    
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const meshData = generateMeshForColor(image, colorIndex, settings);
        if (meshData.vertices.length === 0) continue;
        
        objectIds.push(objectId);
        xml += `    <object id="${objectId}" type="model">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';
        
        // Add vertices
        for (const vertex of meshData.vertices) {
            xml += `          <vertex x="${vertex[0]}" y="${vertex[1]}" z="${vertex[2]}" />\n`;
        }
        
        xml += '        </vertices>\n';
        xml += '        <triangles>\n';
        
        // Add triangles
        for (const triangle of meshData.triangles) {
            xml += `          <triangle v1="${triangle[0]}" v2="${triangle[1]}" v3="${triangle[2]}" pid="1" p1="${colorIndex}" />\n`;
        }
        
        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += '    </object>\n';
        
        objectId++;
    }
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all objects to the build
    for (const id of objectIds) {
        xml += `    <item objectid="${id}" />\n`;
    }
    
    xml += '  </build>\n';
    xml += '</model>\n';
    
    // Download the file
    downloadFile(xml, 'model.3mf', 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

/**
 * Generate mesh data (vertices and triangles) for a specific color
 */
function generateMeshForColor(
    image: PartListImage, 
    colorIndex: number, 
    settings: ThreeDSettings
): { vertices: number[][], triangles: number[][] } {
    const { width, height, pixels } = image;
    const { pixelSize, baseHeight, height: pixelHeight } = settings;
    
    const vertices: number[][] = [];
    const triangles: number[][] = [];
    const vertexMap = new Map<string, number>();
    
    function addVertex(x: number, y: number, z: number): number {
        const key = `${x},${y},${z}`;
        if (vertexMap.has(key)) {
            return vertexMap.get(key)!;
        }
        const index = vertices.length;
        vertices.push([x, y, z]);
        vertexMap.set(key, index);
        return index;
    }
    
    // Create a box for each pixel of this color
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            if (pixels[py][px] !== colorIndex) continue;
            
            const x0 = px * pixelSize;
            const x1 = (px + 1) * pixelSize;
            const y0 = py * pixelSize;
            const y1 = (py + 1) * pixelSize;
            const z0 = baseHeight;
            const z1 = baseHeight + pixelHeight;
            
            // Create box vertices
            const v000 = addVertex(x0, y0, z0);
            const v001 = addVertex(x0, y0, z1);
            const v010 = addVertex(x0, y1, z0);
            const v011 = addVertex(x0, y1, z1);
            const v100 = addVertex(x1, y0, z0);
            const v101 = addVertex(x1, y0, z1);
            const v110 = addVertex(x1, y1, z0);
            const v111 = addVertex(x1, y1, z1);
            
            // Bottom face (z=z0)
            triangles.push([v000, v110, v100]);
            triangles.push([v000, v010, v110]);
            
            // Top face (z=z1)
            triangles.push([v001, v101, v111]);
            triangles.push([v001, v111, v011]);
            
            // Front face (y=y0)
            triangles.push([v000, v100, v101]);
            triangles.push([v000, v101, v001]);
            
            // Back face (y=y1)
            triangles.push([v010, v011, v111]);
            triangles.push([v010, v111, v110]);
            
            // Left face (x=x0)
            triangles.push([v000, v001, v011]);
            triangles.push([v000, v011, v010]);
            
            // Right face (x=x1)
            triangles.push([v100, v110, v111]);
            triangles.push([v100, v111, v101]);
        }
    }
    
    return { vertices, triangles };
}

/**
 * Generate OpenSCAD masks format (zip file with images and .scad file)
 */
async function makeOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const { pixelSize, baseHeight, height: pixelHeight } = settings;
    
    // We'll need JSZip for creating the zip file
    // For now, we'll create individual files and let the user know they need to be zipped
    const files: { name: string, content: string | Blob }[] = [];
    
    // Create a black/white image for each color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                if (pixels[py][px] === colorIndex) {
                    ctx.fillRect(px, py, 1, 1);
                }
            }
        }
        
        // Convert to blob
        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const colorName = partList[colorIndex].target.name.replace(/[^a-zA-Z0-9]/g, '_');
                    files.push({
                        name: `color_${colorIndex}_${colorName}.png`,
                        content: blob
                    });
                }
                resolve();
            });
        });
    }
    
    // Generate the OpenSCAD file
    let scadContent = '// Generated OpenSCAD file for pixel art\n';
    scadContent += `// Image size: ${width}x${height}\n`;
    scadContent += `// Pixel size: ${pixelSize}mm\n`;
    scadContent += `// Base height: ${baseHeight}mm\n`;
    scadContent += `// Pixel height: ${pixelHeight}mm\n\n`;
    
    scadContent += 'union() {\n';
    
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const colorName = partList[colorIndex].target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const color = partList[colorIndex].target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadContent += `  // Color: ${color.name}\n`;
        scadContent += `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += `  translate([0, 0, ${baseHeight}])\n`;
        scadContent += `  scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])\n`;
        scadContent += `  surface(file = "color_${colorIndex}_${colorName}.png", center = false, invert = true);\n\n`;
    }
    
    scadContent += '}\n';
    
    files.push({
        name: 'model.scad',
        content: scadContent
    });
    
    // Since we can't easily create a zip in the browser without additional libraries,
    // we'll use JSZip if available, or download files separately
    if (typeof window !== 'undefined' && (window as any).JSZip) {
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        
        for (const file of files) {
            zip.file(file.name, file.content);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadFile(blob, 'openscad-model.zip', 'application/zip');
    } else {
        // Download files separately
        for (const file of files) {
            const mimeType = file.name.endsWith('.png') ? 'image/png' : 'text/plain';
            downloadFile(file.content, file.name, mimeType);
        }
    }
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
    const blob = typeof content === 'string' 
        ? new Blob([content], { type: mimeType })
        : content;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
