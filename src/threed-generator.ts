import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

const JSZip = (window as any).JSZip;

export async function generate3MF(image: PartListImage, pitch: number, filename: string) {
    await loadJSZip();
    
    const heightPerColor = 1; // mm height per color layer
    const baseHeight = 0.5; // mm base thickness
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials for each color
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        xml += `      <base name="${part.target.name}" displaycolor="#${hex}" />\n`;
    });

    xml += `    </basematerials>\n`;

    let vertexOffset = 0;
    let objectId = 2;

    // Create mesh for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const z = baseHeight + colorIdx * heightPerColor;
                    const x0 = x * pitch;
                    const y0 = y * pitch;
                    const x1 = (x + 1) * pitch;
                    const y1 = (y + 1) * pitch;

                    const v0 = vertices.length;
                    vertices.push([x0, y0, z]);
                    vertices.push([x1, y0, z]);
                    vertices.push([x1, y1, z]);
                    vertices.push([x0, y1, z]);

                    // Top face (2 triangles)
                    triangles.push([v0, v0 + 1, v0 + 2]);
                    triangles.push([v0, v0 + 2, v0 + 3]);

                    // Add base if first layer
                    if (colorIdx === 0) {
                        const zBase = 0;
                        const v4 = vertices.length;
                        vertices.push([x0, y0, zBase]);
                        vertices.push([x1, y0, zBase]);
                        vertices.push([x1, y1, zBase]);
                        vertices.push([x0, y1, zBase]);

                        // Bottom face
                        triangles.push([v4, v4 + 2, v4 + 1]);
                        triangles.push([v4, v4 + 3, v4 + 2]);

                        // Side faces
                        triangles.push([v0, v0 + 1, v4 + 1]);
                        triangles.push([v0, v4 + 1, v4]);

                        triangles.push([v0 + 1, v0 + 2, v4 + 2]);
                        triangles.push([v0 + 1, v4 + 2, v4 + 1]);

                        triangles.push([v0 + 2, v0 + 3, v4 + 3]);
                        triangles.push([v0 + 2, v4 + 3, v4 + 2]);

                        triangles.push([v0 + 3, v0, v4]);
                        triangles.push([v0 + 3, v4, v4 + 3]);
                    }
                }
            }
        }

        if (vertices.length > 0) {
            xml += `    <object id="${objectId}" type="model">\n`;
            xml += `      <mesh>\n`;
            xml += `        <vertices>\n`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />\n`;
            });
            xml += `        </vertices>\n`;
            xml += `        <triangles>\n`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />\n`;
            });
            xml += `        </triangles>\n`;
            xml += `      </mesh>\n`;
            xml += `    </object>\n`;

            objectId++;
        }
    });

    xml += `  </resources>\n`;
    xml += `  <build>\n`;

    // Add all objects to build
    for (let i = 2; i < objectId; i++) {
        xml += `    <item objectid="${i}" />\n`;
    }

    xml += `  </build>\n`;
    xml += `</model>`;

    // Create 3MF package (which is a zip file)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", xml);
    
    // Add required _rels and content types
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);

    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename}.3mf`);
}

export async function generateOpenSCADMasks(image: PartListImage, pitch: number, filename: string) {
    await loadJSZip();
    
    const zip = new JSZip();
    const imageFolder = zip.folder("images");
    
    let scadCode = `// Generated by firaga.io
// OpenSCAD file to create 3D representation from color masks

`;

    const heightPerColor = 1; // mm height per color layer
    
    // Generate one mask image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const imageName = `color_${colorIdx}_${colorName}.png`;
        imageFolder!.file(imageName, blob);
        
        // Add to OpenSCAD code
        const hex = colorEntryToHex(part.target);
        const rgb = hexToRgb(hex);
        const zOffset = colorIdx * heightPerColor;
        
        scadCode += `
// ${part.target.name}
color([${rgb.r}, ${rgb.g}, ${rgb.b}])
translate([0, 0, ${zOffset.toFixed(2)}])
surface(file = "images/${imageName}", center = true, invert = true);
`;
    }
    
    scadCode += `
// Adjust scale as needed
scale([${pitch.toFixed(3)}, ${pitch.toFixed(3)}, ${heightPerColor.toFixed(3)}]);
`;
    
    zip.file(`${filename}.scad`, scadCode);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${filename}_openscad.zip`);
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

async function loadJSZip() {
    if (typeof (window as any).JSZip !== 'undefined') {
        return;
    }
    
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
