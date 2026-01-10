import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad-masks";

export type ThreeDSettings = {
    format: ThreeDFormat;
    layerHeight: number;
    pixelSize: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings, filename);
    } else if (settings.format === "openscad-masks") {
        await generateOpenSCADMasks(image, settings, filename);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const materials: string[] = [];
    const objects: string[] = [];
    
    // Build materials section
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target).substring(1); // Remove #
        materials.push(`    <base:displaycolor value="#${hex}"/>`);
    });
    
    // Build objects for each color layer
    image.partList.forEach((part, materialIdx) => {
        const triangles: string[] = [];
        
        // For each pixel of this color, create a cube
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === materialIdx) {
                    const cubeTriangles = generateCubeTriangles(
                        x * settings.pixelSize,
                        y * settings.pixelSize,
                        materialIdx * settings.layerHeight,
                        settings.pixelSize,
                        settings.layerHeight
                    );
                    triangles.push(...cubeTriangles);
                }
            }
        }
        
        if (triangles.length > 0) {
            objects.push(`  <object id="${materialIdx + 2}" type="model">
    <mesh>
      <vertices>
${generateVertices(triangles).join('\n')}
      </vertices>
      <triangles>
${triangles.map((t, i) => `        <triangle v1="${i * 3}" v2="${i * 3 + 1}" v3="${i * 3 + 2}" pid="1" p1="0"/>`).join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:base="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${filename}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${objects.join('\n')}
  </resources>
  <build>
${objects.map((_, i) => `    <item objectid="${i + 2}"/>`).join('\n')}
  </build>
</model>`;
    
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${filename}.3mf`);
}

function generateCubeTriangles(x: number, y: number, z: number, size: number, height: number): string[] {
    const x1 = x, x2 = x + size;
    const y1 = y, y2 = y + size;
    const z1 = z, z2 = z + height;
    
    // 12 triangles for a cube (2 per face)
    return [
        // Front face
        `${x1} ${y1} ${z1} ${x2} ${y1} ${z1} ${x2} ${y1} ${z2}`,
        `${x1} ${y1} ${z1} ${x2} ${y1} ${z2} ${x1} ${y1} ${z2}`,
        // Back face
        `${x1} ${y2} ${z1} ${x2} ${y2} ${z2} ${x2} ${y2} ${z1}`,
        `${x1} ${y2} ${z1} ${x1} ${y2} ${z2} ${x2} ${y2} ${z2}`,
        // Left face
        `${x1} ${y1} ${z1} ${x1} ${y1} ${z2} ${x1} ${y2} ${z2}`,
        `${x1} ${y1} ${z1} ${x1} ${y2} ${z2} ${x1} ${y2} ${z1}`,
        // Right face
        `${x2} ${y1} ${z1} ${x2} ${y2} ${z2} ${x2} ${y1} ${z2}`,
        `${x2} ${y1} ${z1} ${x2} ${y2} ${z1} ${x2} ${y2} ${z2}`,
        // Top face
        `${x1} ${y1} ${z2} ${x2} ${y1} ${z2} ${x2} ${y2} ${z2}`,
        `${x1} ${y1} ${z2} ${x2} ${y2} ${z2} ${x1} ${y2} ${z2}`,
        // Bottom face
        `${x1} ${y1} ${z1} ${x2} ${y2} ${z1} ${x2} ${y1} ${z1}`,
        `${x1} ${y1} ${z1} ${x1} ${y2} ${z1} ${x2} ${y2} ${z1}`,
    ];
}

function generateVertices(triangles: string[]): string[] {
    const vertices: string[] = [];
    triangles.forEach(triangle => {
        const coords = triangle.split(' ');
        for (let i = 0; i < 9; i += 3) {
            vertices.push(`        <vertex x="${coords[i]}" y="${coords[i+1]}" z="${coords[i+2]}"/>`);
        }
    });
    return vertices;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings, filename: string): Promise<void> {
    const { saveAs } = await import("file-saver");
    const JSZip = (await import("jszip")).default;
    
    const zip = new JSZip();
    
    // Generate one PNG per color (black/white mask)
    const imagePromises = image.partList.map(async (part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return new Promise<{ name: string; data: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const colorName = part.target.code || part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({ name: `color_${colorIdx}_${colorName}.png`, data: blob! });
            });
        });
    });
    
    const images = await Promise.all(imagePromises);
    images.forEach(img => {
        zip.file(img.name, img.data);
    });
    
    // Generate OpenSCAD file
    const scadLines = [
        '// Generated by firaga.io',
        `// Image: ${filename}`,
        `pixel_size = ${settings.pixelSize};`,
        `layer_height = ${settings.layerHeight};`,
        `image_width = ${image.width};`,
        `image_height = ${image.height};`,
        '',
        'module color_layer(image_file, z_offset, color) {',
        '    color(color)',
        '    translate([0, 0, z_offset])',
        '    surface(file = image_file, center = false, invert = true);',
        '}',
        '',
        'union() {'
    ];
    
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const colorName = part.target.code || part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const imageName = `color_${idx}_${colorName}.png`;
        scadLines.push(`    color_layer("${imageName}", ${idx * settings.layerHeight}, "${hex}");`);
    });
    
    scadLines.push('}');
    
    zip.file(`${filename}.scad`, scadLines.join('\n'));
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}
