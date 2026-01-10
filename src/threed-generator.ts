import { PartListImage } from "./image-utils";
import { ColorEntry } from "./color-data";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    pitch: number;
    height: number;
    filename: string;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const pitch = settings.pitch;
    const voxelHeight = settings.height;

    // Build 3MF XML structure
    let modelXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXml += '  <resources>\n';
    
    let objectId = 1;
    const objectIds: number[] = [];

    // Create a mesh for each color
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        
        // Find all pixels of this color and create voxels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    const vx = x * pitch;
                    const vy = y * pitch;
                    
                    // Create a voxel (box) at this position
                    const baseIdx = vertices.length;
                    
                    // Bottom face vertices
                    vertices.push([vx, vy, 0]);
                    vertices.push([vx + pitch, vy, 0]);
                    vertices.push([vx + pitch, vy + pitch, 0]);
                    vertices.push([vx, vy + pitch, 0]);
                    
                    // Top face vertices
                    vertices.push([vx, vy, voxelHeight]);
                    vertices.push([vx + pitch, vy, voxelHeight]);
                    vertices.push([vx + pitch, vy + pitch, voxelHeight]);
                    vertices.push([vx, vy + pitch, voxelHeight]);
                    
                    // Create triangles for all 6 faces
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    
                    // Left face
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }
        
        if (vertices.length > 0) {
            // Add this object to the model
            modelXml += `    <object id="${objectId}" type="model">\n`;
            modelXml += '      <mesh>\n';
            modelXml += '        <vertices>\n';
            
            for (const [vx, vy, vz] of vertices) {
                modelXml += `          <vertex x="${vx.toFixed(3)}" y="${vy.toFixed(3)}" z="${vz.toFixed(3)}" />\n`;
            }
            
            modelXml += '        </vertices>\n';
            modelXml += '        <triangles>\n';
            
            for (const [v1, v2, v3] of triangles) {
                modelXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
            }
            
            modelXml += '        </triangles>\n';
            modelXml += '      </mesh>\n';
            modelXml += `      <metadata name="color">${colorEntryToHex(color.target)}</metadata>\n`;
            modelXml += '    </object>\n';
            
            objectIds.push(objectId);
            objectId++;
        }
    }
    
    // Create a build item that references all objects
    modelXml += '  </resources>\n';
    modelXml += '  <build>\n';
    
    for (const oid of objectIds) {
        modelXml += `    <item objectid="${oid}" />\n`;
    }
    
    modelXml += '  </build>\n';
    modelXml += '</model>\n';

    // Create 3MF package (ZIP file with specific structure)
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Add required files for 3MF
    zip.file('3D/3dmodel.model', modelXml);
    zip.file('[Content_Types].xml', 
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n' +
        '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n' +
        '</Types>');
    
    zip.file('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />\n' +
        '</Relationships>');
    
    // Generate and download the file
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, pixels, partList } = image;
    const pitch = settings.pitch;
    const voxelHeight = settings.height;

    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Generate one PNG per color
    const colorFiles: Array<{ filename: string, colorName: string, color: ColorEntry }> = [];
    
    for (let colorIdx = 0; colorIdx < partList.length; colorIdx++) {
        const color = partList[colorIdx];
        const colorName = sanitizeFilename(color.target.name || `color_${colorIdx}`);
        const filename = `${colorName}.png`;
        colorFiles.push({ filename, colorName, color: color.target });
        
        // Create a canvas for this color mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to PNG blob
        const blob = await canvasToBlob(canvas);
        zip.file(filename, blob);
    }

    // Generate OpenSCAD file
    let scadContent = '// Generated from firaga.io\n';
    scadContent += `// Image: ${settings.filename}\n`;
    scadContent += `// Pitch: ${pitch}mm\n`;
    scadContent += `// Height: ${voxelHeight}mm\n\n`;
    
    scadContent += `pitch = ${pitch};\n`;
    scadContent += `voxel_height = ${voxelHeight};\n`;
    scadContent += `img_width = ${width};\n`;
    scadContent += `img_height = ${height};\n\n`;
    
    scadContent += 'union() {\n';
    
    for (const { filename, colorName, color } of colorFiles) {
        scadContent += `  // ${colorName}\n`;
        scadContent += `  color("${colorEntryToHex(color)}") {\n`;
        scadContent += `    for (y = [0:img_height-1]) {\n`;
        scadContent += `      for (x = [0:img_width-1]) {\n`;
        scadContent += `        // Read pixel from heightmap\n`;
        scadContent += `        if (surface(file = "${filename}", center = false, invert = true)[y][x] > 0.5) {\n`;
        scadContent += `          translate([x * pitch, y * pitch, 0])\n`;
        scadContent += `            cube([pitch, pitch, voxel_height]);\n`;
        scadContent += `        }\n`;
        scadContent += `      }\n`;
        scadContent += `    }\n`;
        scadContent += `  }\n`;
    }
    
    scadContent += '}\n';
    
    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate and download the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, 'image/png');
    });
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

let jsZipPromise: Promise<any> | undefined;

async function loadJSZip(): Promise<any> {
    if (!jsZipPromise) {
        jsZipPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => {
                resolve((window as any).JSZip);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return jsZipPromise;
}
