import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDFormat = '3mf' | 'openscad';

export interface ThreeDSettings {
    format: ThreeDFormat;
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    
    // Build separate triangle meshes for each color
    const colorMeshes: Array<{ color: string; vertices: number[]; triangles: number[] }> = [];
    
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const entry = partList[colorIndex];
        const vertices: number[] = [];
        const triangles: number[] = [];
        let vertexCount = 0;
        
        // Generate mesh for all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x * settings.pixelWidth;
                    const x1 = (x + 1) * settings.pixelWidth;
                    const y0 = y * settings.pixelWidth;
                    const y1 = (y + 1) * settings.pixelWidth;
                    const z0 = 0;
                    const z1 = settings.pixelHeight;
                    
                    // 8 vertices of the cube
                    const cubeVertices = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    ];
                    
                    const baseIdx = vertexCount;
                    for (const v of cubeVertices) {
                        vertices.push(...v);
                    }
                    vertexCount += 8;
                    
                    // 12 triangles (2 per face, 6 faces)
                    const cubeFaces = [
                        [0, 1, 2], [0, 2, 3], // bottom
                        [4, 6, 5], [4, 7, 6], // top
                        [0, 4, 5], [0, 5, 1], // front
                        [1, 5, 6], [1, 6, 2], // right
                        [2, 6, 7], [2, 7, 3], // back
                        [3, 7, 4], [3, 4, 0]  // left
                    ];
                    
                    for (const face of cubeFaces) {
                        triangles.push(baseIdx + face[0]!, baseIdx + face[1]!, baseIdx + face[2]!);
                    }
                }
            }
        }
        
        if (vertices.length > 0) {
            colorMeshes.push({
                color: colorEntryToHex(entry.target).substring(1), // Remove #
                vertices,
                triangles
            });
        }
    }
    
    // Generate 3MF XML
    const xml = build3MFContent(colorMeshes, width * settings.pixelWidth, height * settings.pixelWidth, settings.pixelHeight);
    
    // Create 3MF zip file
    const zip = new JSZip();
    zip.file('3D/3dmodel.model', xml);
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFContent(meshes: Array<{ color: string; vertices: number[]; triangles: number[] }>, width: number, height: number, depth: number): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <resources>
        <basematerials id="1">`;
    
    // Add materials
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i]!;
        xml += `\n            <base name="Color${i}" displaycolor="#${mesh.color}"/>`;
    }
    
    xml += `\n        </basematerials>`;
    
    // Add objects
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i]!;
        xml += `\n        <object id="${i + 2}" type="model">
            <mesh>
                <vertices>`;
        
        for (let j = 0; j < mesh.vertices.length; j += 3) {
            xml += `\n                    <vertex x="${mesh.vertices[j]}" y="${mesh.vertices[j + 1]}" z="${mesh.vertices[j + 2]}"/>`;
        }
        
        xml += `\n                </vertices>
                <triangles>`;
        
        for (let j = 0; j < mesh.triangles.length; j += 3) {
            xml += `\n                    <triangle v1="${mesh.triangles[j]}" v2="${mesh.triangles[j + 1]}" v3="${mesh.triangles[j + 2]}" pid="1" p1="${i}"/>`;
        }
        
        xml += `\n                </triangles>
            </mesh>
        </object>`;
    }
    
    xml += `\n    </resources>
    <build>`;
    
    for (let i = 0; i < meshes.length; i++) {
        xml += `\n        <item objectid="${i + 2}"/>`;
    }
    
    xml += `\n    </build>
</model>`;
    
    return xml;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const zip = new JSZip();
    
    // Generate one monochrome image per color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const entry = partList[colorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const colorName = entry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`color_${colorIndex}_${colorName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel art 3D model
// Image dimensions: ${width}x${height}

pixel_width = ${settings.pixelWidth};
pixel_height = ${settings.pixelHeight};
image_width = ${width};
image_height = ${height};

// Create a voxel cube at the given position
module voxel(x, y, z) {
    translate([x * pixel_width, y * pixel_width, z * pixel_height])
        cube([pixel_width, pixel_width, pixel_height]);
}

// Build layer from heightmap image
module layer_from_image(image_file, z_offset) {
    // Read the image and create voxels for black pixels
    for (y = [0:image_height-1]) {
        for (x = [0:image_width-1]) {
            // Note: In practice, surface() or a script would be used
            // This is a template - users should load images with surface()
        }
    }
}

union() {
`;
    
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const entry = partList[colorIndex];
        const colorName = entry.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadContent += `    // ${entry.target.name} (${entry.count} pixels)
    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
    translate([0, 0, ${colorIndex * settings.pixelHeight}])
    linear_extrude(height=pixel_height)
    scale([pixel_width, pixel_width, 1])
    surface(file="color_${colorIndex}_${colorName}.png", center=false, invert=true);
    
`;
    }
    
    scadContent += `}

// Instructions:
// 1. Open this file in OpenSCAD
// 2. Make sure all PNG files are in the same directory
// 3. Render with F6 or Preview with F5
// 4. Export to STL for 3D printing
`;
    
    zip.file('model.scad', scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}
