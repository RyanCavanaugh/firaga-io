import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type ThreeDSettings = {
    format: '3mf' | 'openscad';
    pixelHeight: number;
    baseThickness: number;
    filename: string;
};

export async function export3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === '3mf') {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const content = generate3MFContent(image, settings);
    const blob = new Blob([content], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList, pixels } = image;
    const pixelSize = 1.0;
    const { pixelHeight, baseThickness } = settings;
    
    let meshId = 1;
    const objectIds: number[] = [];
    const meshXML: string[] = [];
    
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const color = colorEntryToHex(part.target);
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    const x0 = x * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = y * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = baseThickness;
                    const z1 = baseThickness + pixelHeight;
                    
                    const baseVertex = vertexCount;
                    
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `<vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    
                    triangles.push(
                        `<triangle v1="${baseVertex + 0}" v2="${baseVertex + 1}" v3="${baseVertex + 2}" />`,
                        `<triangle v1="${baseVertex + 0}" v2="${baseVertex + 2}" v3="${baseVertex + 3}" />`,
                        `<triangle v1="${baseVertex + 4}" v2="${baseVertex + 6}" v3="${baseVertex + 5}" />`,
                        `<triangle v1="${baseVertex + 4}" v2="${baseVertex + 7}" v3="${baseVertex + 6}" />`,
                        `<triangle v1="${baseVertex + 0}" v2="${baseVertex + 4}" v3="${baseVertex + 5}" />`,
                        `<triangle v1="${baseVertex + 0}" v2="${baseVertex + 5}" v3="${baseVertex + 1}" />`,
                        `<triangle v1="${baseVertex + 1}" v2="${baseVertex + 5}" v3="${baseVertex + 6}" />`,
                        `<triangle v1="${baseVertex + 1}" v2="${baseVertex + 6}" v3="${baseVertex + 2}" />`,
                        `<triangle v1="${baseVertex + 2}" v2="${baseVertex + 6}" v3="${baseVertex + 7}" />`,
                        `<triangle v1="${baseVertex + 2}" v2="${baseVertex + 7}" v3="${baseVertex + 3}" />`,
                        `<triangle v1="${baseVertex + 3}" v2="${baseVertex + 7}" v3="${baseVertex + 4}" />`,
                        `<triangle v1="${baseVertex + 3}" v2="${baseVertex + 4}" v3="${baseVertex + 0}" />`
                    );
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const objectId = meshId++;
            objectIds.push(objectId);
            
            meshXML.push(`  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
${vertices.map(v => '        ' + v).join('\n')}
      </vertices>
      <triangles>
${triangles.map(t => '        ' + t).join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    }
    
    const colorResources = partList.map((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1);
        return `  <basematerials id="${1000 + idx}">
    <base name="${part.target.name}" displaycolor="#${color}" />
  </basematerials>`;
    }).join('\n');
    
    const components = objectIds.map((id, idx) => {
        return `    <component objectid="${id}" pid="${1000 + idx}" pindex="0" />`;
    }).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${colorResources}
${meshXML.join('\n')}
  <object id="${meshId}" type="model">
    <components>
${components}
    </components>
  </object>
  </resources>
  <build>
    <item objectid="${meshId}" />
  </build>
</model>`;
}

async function exportOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseThickness } = settings;
    
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.split(',')[1];
        zip.file(`mask_${partIdx}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
    }
    
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, partList } = image;
    const { pixelHeight, baseThickness } = settings;
    const pixelSize = 1.0;
    
    let scadCode = `// Generated OpenSCAD file for ${width}x${height} pixel art
// Pixel size: ${pixelSize}mm
// Pixel height: ${pixelHeight}mm
// Base thickness: ${baseThickness}mm

`;
    
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const part = partList[partIdx];
        const filename = `mask_${partIdx}_${sanitizeFilename(part.target.name)}.png`;
        const color = hexToRGB(colorEntryToHex(part.target));
        
        scadCode += `// ${part.target.name} (${part.count} pixels)
color([${color[0]}, ${color[1]}, ${color[2]}])
translate([0, 0, ${baseThickness}])
scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])
surface(file = "${filename}", center = false, invert = true);

`;
    }
    
    scadCode += `// Base layer
color([0.9, 0.9, 0.9])
translate([0, 0, 0])
cube([${width * pixelSize}, ${height * pixelSize}, ${baseThickness}]);
`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function hexToRGB(hex: string): [number, number, number] {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    return [r, g, b];
}
