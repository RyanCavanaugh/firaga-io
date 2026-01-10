import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';

export function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MF(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

function generate3MF(image: PartListImage): string {
    const width = image.width;
    const height = image.height;
    const depth = 1; // Height per layer
    const pixelSize = 1; // Size of each pixel in mm

    let vertices = '';
    let triangles = '';
    let vertexCount = 0;
    let triangleCount = 0;

    // Generate vertices and triangles for each color
    const objectsXML: string[] = [];
    
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        vertices = '';
        triangles = '';
        let localVertexCount = 0;

        // Create a cube for each pixel of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create 8 vertices for a cube
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = 0;
                    const z1 = depth;

                    const baseVertex = localVertexCount;
                    
                    // 8 vertices of the cube
                    vertices += `    <vertex x="${x0}" y="${y0}" z="${z0}" />\n`;
                    vertices += `    <vertex x="${x1}" y="${y0}" z="${z0}" />\n`;
                    vertices += `    <vertex x="${x1}" y="${y1}" z="${z0}" />\n`;
                    vertices += `    <vertex x="${x0}" y="${y1}" z="${z0}" />\n`;
                    vertices += `    <vertex x="${x0}" y="${y0}" z="${z1}" />\n`;
                    vertices += `    <vertex x="${x1}" y="${y0}" z="${z1}" />\n`;
                    vertices += `    <vertex x="${x1}" y="${y1}" z="${z1}" />\n`;
                    vertices += `    <vertex x="${x0}" y="${y1}" z="${z1}" />\n`;
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles += `    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 2}" />\n`;
                    triangles += `    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 3}" />\n`;
                    // Top face
                    triangles += `    <triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />\n`;
                    triangles += `    <triangle v1="${baseVertex + 4}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />\n`;
                    // Front face
                    triangles += `    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 4}" v3="${baseVertex + 5}" />\n`;
                    triangles += `    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 1}" />\n`;
                    // Back face
                    triangles += `    <triangle v1="${baseVertex + 2}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />\n`;
                    triangles += `    <triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />\n`;
                    // Left face
                    triangles += `    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 3}" v3="${baseVertex + 7}" />\n`;
                    triangles += `    <triangle v1="${baseVertex + 0}" v2="${baseVertex + 7}" v3="${baseVertex + 4}" />\n`;
                    // Right face
                    triangles += `    <triangle v1="${baseVertex + 1}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />\n`;
                    triangles += `    <triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 2}" />\n`;

                    localVertexCount += 8;
                }
            }
        }

        if (localVertexCount > 0) {
            objectsXML.push(`  <object id="${partIndex + 2}" type="model">
   <mesh>
    <vertices>
${vertices}    </vertices>
    <triangles>
${triangles}    </triangles>
   </mesh>
  </object>`);
        }
    }

    // Build component list
    const components = objectsXML.map((_, idx) => 
        `   <component objectid="${idx + 2}" />`
    ).join('\n');

    const model3D = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
  <object id="1" type="model">
   <components>
${components}
   </components>
  </object>
${objectsXML.join('\n')}
 </resources>
 <build>
  <item objectid="1" />
 </build>
</model>`;

    return model3D;
}

export function exportOpenSCADMasks(image: PartListImage, filename: string) {
    // Create zip file containing mask images and .scad file
    const zip = new JSZip();

    // Generate mask images for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const maskImage = generateMaskImage(image, partIndex);
        zip.file(`mask_${partIndex}_${sanitizeFilename(part.target.name)}.png`, maskImage.split(',')[1], { base64: true });
    }

    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);

    // Generate and save zip
    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        saveAs(content, `${filename}_openscad.zip`);
    });
}

function generateMaskImage(image: PartListImage, partIndex: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(image.width, image.height);
    const data = imageData.data;

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === partIndex;
            const value = isColor ? 255 : 0; // White for filled, black for empty
            data[idx] = value;     // R
            data[idx + 1] = value; // G
            data[idx + 2] = value; // B
            data[idx + 3] = 255;   // A
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

function generateOpenSCADFile(image: PartListImage): string {
    const width = image.width;
    const height = image.height;
    const layerHeight = 1;
    const pixelSize = 1;

    let scadCode = `// OpenSCAD file for ${width}x${height} image
// Generated by Firaga.io

`;

    // Add modules for each color layer
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        const colorName = sanitizeFilename(part.target.name);
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;

        scadCode += `module layer_${partIndex}_${colorName}() {
  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  translate([0, 0, ${partIndex * layerHeight}])
  scale([${pixelSize}, ${pixelSize}, ${layerHeight}])
  surface(file = "mask_${partIndex}_${colorName}.png", center = true, invert = true);
}

`;
    }

    // Generate union of all layers
    scadCode += `// Combine all layers\n`;
    scadCode += `union() {\n`;
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const colorName = sanitizeFilename(image.partList[partIndex].target.name);
        scadCode += `  layer_${partIndex}_${colorName}();\n`;
    }
    scadCode += `}\n`;

    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
