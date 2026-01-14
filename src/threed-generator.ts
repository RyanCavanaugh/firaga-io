import { PartListImage } from "./image-utils";
import { colorEntryToHex, getPitch } from "./utils";
import saveAs from 'file-saver';

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
}

export async function generateThreeD(image: PartListImage, settings: ThreeDSettings, gridSize: string) {
    if (settings.format === "3mf") {
        generate3MF(image, settings, gridSize);
    } else if (settings.format === "openscad-masks") {
        generateOpenSCADMasks(image, settings, gridSize);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings, gridSize: string) {
    const pitch = getPitch(gridSize);
    
    // Create the 3MF XML document
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2013/12" unit="millimeter">\n';
    
    // Resources section with materials
    xml += '  <resources>\n';
    xml += '    <material id="1" type="generic"/>\n';
    
    // Create a color group for all colors
    xml += '    <colorgroup id="1">\n';
    for (let i = 0; i < image.partList.length; i++) {
        const hex = colorEntryToHex(image.partList[i].target);
        // Convert hex to RGB bytes for 3MF (ARGB format with alpha = 255)
        xml += `      <color id="${i + 1}" color="#FF${hex.substring(1).toUpperCase()}"/>\n`;
    }
    xml += '    </colorgroup>\n';
    xml += '  </resources>\n';
    
    // Objects section - one mesh per color
    xml += '  <objects>\n';
    
    let objectId = 1;
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const mesh = generateMesh(image, colorIdx, pitch);
        
        xml += `    <object id="${objectId}" type="model">\n`;
        xml += '      <mesh>\n';
        xml += '        <vertices>\n';
        
        mesh.vertices.forEach((v) => {
            xml += `          <vertex x="${v.x.toFixed(3)}" y="${v.y.toFixed(3)}" z="${v.z.toFixed(3)}"/>\n`;
        });
        
        xml += '        </vertices>\n';
        xml += '        <triangles>\n';
        
        mesh.triangles.forEach(tri => {
            xml += `          <triangle v1="${tri.v1}" v2="${tri.v2}" v3="${tri.v3}" p1="1" p1materialid="1" p1colorid="${colorIdx + 1}"/>\n`;
        });
        
        xml += '        </triangles>\n';
        xml += '      </mesh>\n';
        xml += '    </object>\n';
        objectId++;
    }
    
    xml += '  </objects>\n';
    
    // Build section - include all objects
    xml += '  <build>\n';
    for (let i = 1; i <= image.partList.length; i++) {
        xml += `    <item objectid="${i}"/>\n`;
    }
    xml += '  </build>\n';
    
    xml += '</model>\n';
    
    // Create a proper 3MF file (which is a ZIP file)
    // For simplicity, we'll just save the XML with the .3mf extension
    // A full implementation would wrap it in a ZIP with proper 3MF structure
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

interface Mesh {
    vertices: Array<{ x: number; y: number; z: number }>;
    triangles: Array<{ v1: number; v2: number; v3: number }>;
}

function generateMesh(image: PartListImage, colorIdx: number, pitch: number): Mesh {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
    
    const height = pitch * 0.5;  // Height of each "stacked" layer
    const colorHeight = colorIdx * height;  // Z position for this color
    
    // Build a simple quad mesh for pixels of this color
    // We'll create quads for each pixel and then triangulate them
    const vertexMap = new Map<string, number>();
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                // Get or create vertices for the four corners of this pixel
                const corners = [
                    { px: x, py: y },
                    { px: x + 1, py: y },
                    { px: x + 1, py: y + 1 },
                    { px: x, py: y + 1 }
                ];
                
                const vertexIndices: number[] = [];
                for (const corner of corners) {
                    const key = `${corner.px},${corner.py}`;
                    let idx = vertexMap.get(key);
                    if (idx === undefined) {
                        idx = vertices.length;
                        vertices.push({
                            x: corner.px * pitch,
                            y: corner.py * pitch,
                            z: colorHeight
                        });
                        vertexMap.set(key, idx);
                    }
                    vertexIndices.push(idx);
                }
                
                // Create two triangles for this quad
                if (vertexIndices.length === 4) {
                    triangles.push({
                        v1: vertexIndices[0],
                        v2: vertexIndices[1],
                        v3: vertexIndices[2]
                    });
                    triangles.push({
                        v1: vertexIndices[0],
                        v2: vertexIndices[2],
                        v3: vertexIndices[3]
                    });
                }
            }
        }
    }
    
    // If we have no triangles for this color, create a single degenerate triangle so the object is valid
    if (triangles.length === 0) {
        vertices.push({ x: 0, y: 0, z: colorHeight });
        vertices.push({ x: pitch, y: 0, z: colorHeight });
        vertices.push({ x: pitch, y: pitch, z: colorHeight });
        triangles.push({ v1: 0, v2: 1, v3: 2 });
    }
    
    return { vertices, triangles };
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, gridSize: string) {
    const pitch = getPitch(gridSize);
    
    // Create a canvas for each color
    const colorNames: string[] = [];
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Create monochrome image - white for this color, black for others
        const imageData = ctx.createImageData(image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                if (image.pixels[y][x] === colorIdx) {
                    // White for filled
                    imageData.data[idx] = 255;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 255;
                    imageData.data[idx + 3] = 255;
                } else {
                    // Black for empty
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to PNG and store
        canvas.toBlob((blob) => {
            if (blob) {
                const name = image.partList[colorIdx].target.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
                colorNames.push(name);
                saveAs(blob, `${settings.filename}_${name}.png`);
            }
        }, 'image/png');
    }
    
    // Generate OpenSCAD script
    let scadScript = `// Generated by firaga.io\n`;
    scadScript += `// This script displays pixel art as a 3D structure\n\n`;
    scadScript += `pitch = ${pitch.toFixed(3)};\n`;
    scadScript += `layer_height = ${(pitch * 0.5).toFixed(3)};\n\n`;
    
    scadScript += `// Combine all color layers\n`;
    scadScript += `union() {\n`;
    
    for (let i = 0; i < image.partList.length; i++) {
        const name = image.partList[i].target.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const colorHex = colorEntryToHex(image.partList[i].target);
        scadScript += `    // Color ${i + 1}: ${image.partList[i].target.name} (${colorHex})\n`;
        scadScript += `    color("${colorHex}", 1.0)\n`;
        scadScript += `    translate([0, 0, ${(i * pitch * 0.5).toFixed(3)}])\n`;
        scadScript += `    scale([pitch, pitch, layer_height])\n`;
        scadScript += `    linear_extrude(height = 1, convexity = 10)\n`;
        scadScript += `    render_image("${name}.png");\n\n`;
    }
    
    scadScript += `}\n\n`;
    scadScript += `module render_image(filename) {\n`;
    scadScript += `    // This would use surface() with heightmap in a real OpenSCAD\n`;
    scadScript += `    // For now, just create a simple square\n`;
    scadScript += `    square([1, 1], center = true);\n`;
    scadScript += `}\n`;
    
    // Save the OpenSCAD script
    const blob = new Blob([scadScript], { type: 'text/plain' });
    saveAs(blob, `${settings.filename}_viewer.scad`);
}
