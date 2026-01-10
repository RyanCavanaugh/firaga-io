import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: "3mf" | "openscad";
    filename: string;
    pixelHeight: number;
    baseThickness: number;
};

export function generate3D(image: PartListImage, settings: ThreeDSettings): void {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const materials: string[] = [];
    const meshes: string[] = [];
    
    image.partList.forEach((entry, index) => {
        const color = colorEntryToHex(entry.target).substring(1); // Remove #
        const materialId = index + 1;
        
        materials.push(`    <basematerials:basematerial name="${entry.target.name}" displaycolor="#${color}" />`);
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === index) {
                    const v = createPixelMesh(x, y, settings.pixelHeight, settings.baseThickness);
                    vertices.push(...v.vertices);
                    triangles.push(...v.triangles.map(t => 
                        `        <triangle v1="${t.v1 + vertexCount}" v2="${t.v2 + vertexCount}" v3="${t.v3 + vertexCount}" />`
                    ));
                    vertexCount += v.vertices.length;
                }
            }
        }
        
        if (vertices.length > 0) {
            meshes.push(`    <object id="${materialId}" type="model">
      <mesh>
        <vertices>
${vertices.map(v => `          ${v}`).join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    });
    
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials:basematerialgroup id="1">
${materials.join('\n')}
    </basematerials:basematerialgroup>
${meshes.join('\n')}
  </resources>
  <build>
${image.partList.map((_, i) => `    <item objectid="${i + 1}" />`).join('\n')}
  </build>
</model>`;
    
    const blob = new Blob([modelXml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function createPixelMesh(x: number, y: number, height: number, baseThickness: number): {
    vertices: string[];
    triangles: Array<{ v1: number; v2: number; v3: number }>;
} {
    const vertices: string[] = [];
    const triangles: Array<{ v1: number; v2: number; v3: number }> = [];
    
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = 0;
    const z1 = baseThickness;
    const z2 = baseThickness + height;
    
    // Bottom face (base layer)
    vertices.push(
        `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
        `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
        `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
        `<vertex x="${x0}" y="${y1}" z="${z0}" />`
    );
    
    // Middle layer (top of base)
    vertices.push(
        `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
        `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
        `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
        `<vertex x="${x0}" y="${y1}" z="${z1}" />`
    );
    
    // Top face (colored pixel)
    vertices.push(
        `<vertex x="${x0}" y="${y0}" z="${z2}" />`,
        `<vertex x="${x1}" y="${y0}" z="${z2}" />`,
        `<vertex x="${x1}" y="${y1}" z="${z2}" />`,
        `<vertex x="${x0}" y="${y1}" z="${z2}" />`
    );
    
    // Bottom triangles
    triangles.push({ v1: 0, v2: 2, v3: 1 }, { v1: 0, v2: 3, v3: 2 });
    
    // Side faces (base)
    triangles.push({ v1: 0, v2: 1, v3: 5 }, { v1: 0, v2: 5, v3: 4 });
    triangles.push({ v1: 1, v2: 2, v3: 6 }, { v1: 1, v2: 6, v3: 5 });
    triangles.push({ v1: 2, v2: 3, v3: 7 }, { v1: 2, v2: 7, v3: 6 });
    triangles.push({ v1: 3, v2: 0, v3: 4 }, { v1: 3, v2: 4, v3: 7 });
    
    // Side faces (colored)
    triangles.push({ v1: 4, v2: 5, v3: 9 }, { v1: 4, v2: 9, v3: 8 });
    triangles.push({ v1: 5, v2: 6, v3: 10 }, { v1: 5, v2: 10, v3: 9 });
    triangles.push({ v1: 6, v2: 7, v3: 11 }, { v1: 6, v2: 11, v3: 10 });
    triangles.push({ v1: 7, v2: 4, v3: 8 }, { v1: 7, v2: 8, v3: 11 });
    
    // Top triangles
    triangles.push({ v1: 8, v2: 9, v3: 10 }, { v1: 8, v2: 10, v3: 11 });
    
    return { vertices, triangles };
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): void {
    const zip = new JSZip();
    const scadLines: string[] = [];
    
    scadLines.push('// Generated heightmap display');
    scadLines.push(`pixel_size = 1;`);
    scadLines.push(`base_height = ${settings.baseThickness};`);
    scadLines.push(`pixel_height = ${settings.pixelHeight};`);
    scadLines.push('');
    
    image.partList.forEach((entry, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isMatch = image.pixels[y][x] === index;
                imageData.data[idx] = isMatch ? 255 : 0;
                imageData.data[idx + 1] = isMatch ? 255 : 0;
                imageData.data[idx + 2] = isMatch ? 255 : 0;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const filename = `color_${index}_${entry.target.name.replace(/[^a-z0-9]/gi, '_')}.png`;
                zip.file(filename, blob);
                
                const color = colorEntryToHex(entry.target);
                const r = parseInt(color.substring(1, 3), 16) / 255;
                const g = parseInt(color.substring(3, 5), 16) / 255;
                const b = parseInt(color.substring(5, 7), 16) / 255;
                
                scadLines.push(`// ${entry.target.name}`);
                scadLines.push(`color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
                scadLines.push(`  translate([0, 0, base_height])`);
                scadLines.push(`    scale([pixel_size, pixel_size, pixel_height])`);
                scadLines.push(`      surface(file = "${filename}", center = false, invert = true);`);
                scadLines.push('');
            }
        });
    });
    
    scadLines.push('// Base layer');
    scadLines.push(`cube([${image.width}, ${image.height}, base_height]);`);
    
    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));
    
    setTimeout(() => {
        zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
            saveAs(content, `${settings.filename}_openscad.zip`);
        });
    }, 500);
}
