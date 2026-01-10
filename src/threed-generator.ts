import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const JSZip: any;

export type ThreeDSettings = {
    format: '3mf' | 'openscad-masks';
    filename: string;
    pixelHeight: number;
    baseHeight: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const models: string[] = [];
    const materials: string[] = [];
    
    // Generate materials for each color
    image.partList.forEach((entry, index) => {
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        materials.push(`    <base name="${entry.target.name}" displaycolor="${hex.slice(1)}">
      <color r="${r.toFixed(6)}" g="${g.toFixed(6)}" b="${b.toFixed(6)}" a="1.000000" />
    </base>`);
    });

    // Generate mesh for each color
    let objectId = 1;
    image.partList.forEach((entry, colorIndex) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        let vertexIndex = 0;

        // Build mesh for this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = settings.pixelHeight;

                    // 8 vertices of the cube
                    const baseIdx = vertexIndex;
                    vertices.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
                    vertices.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    // Right
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);

                    vertexIndex += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const verticesStr = vertices.map(([x, y, z]) => 
                `      <vertex x="${x.toFixed(6)}" y="${y.toFixed(6)}" z="${z.toFixed(6)}" />`
            ).join('\n');

            const trianglesStr = triangles.map(([v1, v2, v3]) =>
                `      <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
            ).join('\n');

            models.push(`    <object id="${objectId}" type="model" pid="1" pindex="${colorIndex}">
      <mesh>
        <vertices>
${verticesStr}
        </vertices>
        <triangles>
${trianglesStr}
        </triangles>
      </mesh>
    </object>`);

            objectId++;
        }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${settings.filename}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials id="1">
${materials.join('\n')}
    </basematerials>
${models.join('\n')}
  </resources>
  <build>
${models.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();

    const scadParts: string[] = [];
    scadParts.push(`// Generated by firaga.io`);
    scadParts.push(`// Image: ${settings.filename}`);
    scadParts.push(`pixel_size = 1;`);
    scadParts.push(`pixel_height = ${settings.pixelHeight};`);
    scadParts.push(`base_height = ${settings.baseHeight};`);
    scadParts.push(``);

    // Generate a mask image for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const entry = image.partList[colorIdx];
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Create black/white mask
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                const value = isThisColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `color_${colorIdx}_${entry.symbol}.png`;
        zip.file(filename, blob);
        
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        scadParts.push(`// ${entry.target.name} (${entry.symbol})`);
        scadParts.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadParts.push(`  translate([0, 0, base_height])`);
        scadParts.push(`    scale([pixel_size, pixel_size, pixel_height])`);
        scadParts.push(`      surface(file="${filename}", invert=true, center=true);`);
        scadParts.push(``);
    }

    // Add base
    scadParts.push(`// Base`);
    scadParts.push(`color([0.5, 0.5, 0.5])`);
    scadParts.push(`  cube([${image.width}, ${image.height}, base_height], center=true);`);

    const scadContent = scadParts.join('\n');
    zip.file('model.scad', scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}
