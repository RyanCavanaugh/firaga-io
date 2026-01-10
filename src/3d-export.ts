import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";
import { saveAs } from 'file-saver';

export type Export3DFormat = "3mf" | "openscad-masks";

export type Export3DSettings = {
    format: Export3DFormat;
    filename: string;
    beadHeight: number;
    beadDiameter: number;
};

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else if (settings.format === "openscad-masks") {
        await exportOpenSCADMasks(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const { width, height, pixels, partList } = image;
    const { beadHeight, beadDiameter } = settings;
    
    // Group pixels by color
    const colorGroups = new Map<number, Array<{x: number, y: number}>>();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = pixels[y][x];
            if (colorIndex !== undefined && partList[colorIndex]) {
                if (!colorGroups.has(colorIndex)) {
                    colorGroups.set(colorIndex, []);
                }
                colorGroups.get(colorIndex)!.push({x, y});
            }
        }
    }

    // Build 3MF file
    let objectId = 1;
    const objects: string[] = [];
    const buildItems: string[] = [];
    
    colorGroups.forEach((positions, colorIndex) => {
        const color = partList[colorIndex];
        
        positions.forEach(pos => {
            const vertices: string[] = [];
            const triangles: string[] = [];
            
            // Create a cylinder for each bead
            const centerX = pos.x * beadDiameter;
            const centerY = pos.y * beadDiameter;
            const radius = beadDiameter / 2;
            const segments = 16;
            
            // Bottom circle vertices
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                vertices.push(`          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="0"/>`);
            }
            
            // Top circle vertices
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                vertices.push(`          <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${beadHeight.toFixed(3)}"/>`);
            }
            
            // Bottom cap triangles
            for (let i = 1; i < segments - 1; i++) {
                triangles.push(`          <triangle v1="0" v2="${i}" v3="${i + 1}"/>`);
            }
            
            // Top cap triangles
            for (let i = 1; i < segments - 1; i++) {
                triangles.push(`          <triangle v1="${segments}" v2="${segments + i + 1}" v3="${segments + i}"/>`);
            }
            
            // Side triangles
            for (let i = 0; i < segments; i++) {
                const next = (i + 1) % segments;
                triangles.push(`          <triangle v1="${i}" v2="${segments + i}" v3="${segments + next}"/>`);
                triangles.push(`          <triangle v1="${i}" v2="${segments + next}" v3="${next}"/>`);
            }
            
            const mesh = `    <object id="${objectId}" name="bead_${colorIndex}_${pos.x}_${pos.y}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
            
            objects.push(mesh);
            buildItems.push(`    <item objectid="${objectId}"/>`);
            objectId++;
        });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
  </build>
</model>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings) {
    const { width, height, pixels, partList } = image;
    const { beadHeight, beadDiameter } = settings;
    
    // Group pixels by color
    const colorIndices = new Set<number>();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = pixels[y][x];
            if (colorIndex !== undefined && partList[colorIndex]) {
                colorIndices.add(colorIndex);
            }
        }
    }
    
    const scadParts: string[] = [];
    const promises: Promise<void>[] = [];
    
    colorIndices.forEach(colorIndex => {
        const entry = partList[colorIndex];
        const color = entry.target;
        const colorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `mask_${colorIndex}_${colorName}.png`;
        
        // Create black and white mask
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Save mask image
        const promise = new Promise<void>((resolve) => {
            canvas.toBlob(blob => {
                if (blob) {
                    saveAs(blob, filename);
                }
                resolve();
            });
        });
        promises.push(promise);
        
        const hexColor = colorEntryToHex(color);
        const r = parseInt(hexColor.substr(1, 2), 16) / 255;
        const g = parseInt(hexColor.substr(3, 2), 16) / 255;
        const b = parseInt(hexColor.substr(5, 2), 16) / 255;
        
        scadParts.push(`
// ${color.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  scale([${beadDiameter}, ${beadDiameter}, ${beadHeight}])
    surface(file = "${filename}", center = true, invert = true);
`);
    });
    
    const scadContent = `// Generated by firaga.io
// Bead art 3D representation
// Place all mask PNG files in the same directory as this .scad file

${scadParts.join('\n')}
`;
    
    // Save OpenSCAD file
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    saveAs(scadBlob, `${settings.filename}_beads.scad`);
    
    // Wait for all mask images to be saved
    await Promise.all(promises);
    
    alert(`OpenSCAD export complete! ${colorIndices.size + 1} files will be downloaded. Place all files in the same directory.`);
}
