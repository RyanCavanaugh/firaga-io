import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    pixelHeight: number;
    pixelWidth: number;
    baseThickness: number;
    filename: string;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings): void {
    const xml = create3MFDocument(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function create3MFDocument(image: PartListImage, settings: ThreeDSettings): string {
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    
    let meshes = '';
    let resources = '';
    let objectId = 1;
    let materialId = 1;
    const materialMap = new Map<number, number>();
    
    // Create materials for each color
    const baseMaterials: string[] = [];
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        baseMaterials.push(`    <base name="${part.target.name}" displaycolor="#${hex.slice(1)}" />`);
        materialMap.set(idx, materialId);
        materialId++;
    });
    
    // Generate meshes for each color
    image.partList.forEach((part, partIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];
        const vertexMap = new Map<string, number>();
        
        function addVertex(x: number, y: number, z: number): number {
            const key = `${x},${y},${z}`;
            let idx = vertexMap.get(key);
            if (idx === undefined) {
                idx = vertices.length;
                vertices.push([x, y, z]);
                vertexMap.set(key, idx);
            }
            return idx;
        }
        
        // Create a box for each pixel of this color
        for (let py = 0; py < image.height; py++) {
            for (let px = 0; px < image.width; px++) {
                if (image.pixels[py][px] !== partIdx) continue;
                
                const x0 = px * pixelWidth;
                const x1 = (px + 1) * pixelWidth;
                const y0 = py * pixelHeight;
                const y1 = (py + 1) * pixelHeight;
                const z0 = 0;
                const z1 = baseThickness;
                
                // 8 vertices of the box
                const v000 = addVertex(x0, y0, z0);
                const v001 = addVertex(x0, y0, z1);
                const v010 = addVertex(x0, y1, z0);
                const v011 = addVertex(x0, y1, z1);
                const v100 = addVertex(x1, y0, z0);
                const v101 = addVertex(x1, y0, z1);
                const v110 = addVertex(x1, y1, z0);
                const v111 = addVertex(x1, y1, z1);
                
                // 12 triangles (2 per face, 6 faces)
                // Bottom face (z=0)
                triangles.push([v000, v100, v110]);
                triangles.push([v000, v110, v010]);
                // Top face (z=z1)
                triangles.push([v001, v011, v111]);
                triangles.push([v001, v111, v101]);
                // Front face (y=y0)
                triangles.push([v000, v001, v101]);
                triangles.push([v000, v101, v100]);
                // Back face (y=y1)
                triangles.push([v010, v110, v111]);
                triangles.push([v010, v111, v011]);
                // Left face (x=x0)
                triangles.push([v000, v010, v011]);
                triangles.push([v000, v011, v001]);
                // Right face (x=x1)
                triangles.push([v100, v101, v111]);
                triangles.push([v100, v111, v110]);
            }
        }
        
        if (vertices.length === 0) return;
        
        const vertexStr = vertices.map(([x, y, z]) => 
            `      <vertex x="${x}" y="${y}" z="${z}" />`
        ).join('\n');
        
        const matId = materialMap.get(partIdx)!;
        const triangleStr = triangles.map(([v1, v2, v3]) => 
            `      <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${matId}" />`
        ).join('\n');
        
        const mesh = `  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
${vertexStr}
      </vertices>
      <triangles>
${triangleStr}
      </triangles>
    </mesh>
  </object>`;
        
        meshes += mesh + '\n';
        resources += `    <item objectid="${objectId}" />\n`;
        objectId++;
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <basematerials id="1">
${baseMaterials.join('\n')}
    </basematerials>
${meshes}
  </resources>
  <build>
${resources}
  </build>
</model>`;
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const zip = new JSZip();
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    
    // Create one mask image per color
    const maskPromises = image.partList.map(async (part, partIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (transparent)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Fill pixels of this color with black
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `mask_${partIdx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, blob);
        
        return { filename, part, partIdx };
    });
    
    const masks = await Promise.all(maskPromises);
    
    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// Pixel dimensions: ${image.width}x${image.height}
// Physical dimensions: ${image.width * pixelWidth}x${image.height * pixelHeight}x${baseThickness}mm

`;
    
    masks.forEach(({ filename, part }) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        scadContent += `// ${part.target.name} (${part.count} pixels)
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([${pixelWidth}, ${pixelHeight}, ${baseThickness}])
    surface(file="${filename}", center=true, invert=true);

`;
    });
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
