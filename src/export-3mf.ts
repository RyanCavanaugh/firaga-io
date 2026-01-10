import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export interface Export3MFSettings {
    filename: string;
    pixelHeight: number;
    pixelWidth: number;
    baseThickness: number;
}

/**
 * Exports a PartListImage as a 3MF file containing triangle meshes with separate materials per color
 */
export function export3MF(image: PartListImage, settings: Export3MFSettings): void {
    const xml = generate3MFContent(image, settings);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3MFSettings): string {
    const { pixelWidth, pixelHeight, baseThickness } = settings;
    
    // Build material definitions
    const materials: string[] = [];
    const materialMap = new Map<number, number>();
    
    image.partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target);
        // Remove # and convert to RRGGBB format
        const colorHex = color.substring(1);
        materials.push(`<basematerials:base name="${escapeXml(part.target.name)}" displaycolor="#${colorHex}" />`);
        materialMap.set(idx, idx);
    });
    
    // Generate meshes for each color
    const meshObjects: string[] = [];
    
    image.partList.forEach((part, partIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelPartIdx = image.pixels[y][x];
                if (pixelPartIdx === partIdx) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y0 = y * pixelHeight;
                    const y1 = (y + 1) * pixelHeight;
                    const z0 = 0;
                    const z1 = baseThickness;
                    
                    // 8 vertices of the box
                    const baseIdx = vertexCount;
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
                    
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face (z=z1)
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face (y=y0)
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 0}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face (y=y1)
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face (x=x0)
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 0}" v3="${baseIdx + 4}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 3}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    // Right face (x=x1)
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`<triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshContent = `
    <object id="${partIdx + 1}" type="model">
      <mesh>
        <vertices>
          ${vertices.join('\n          ')}
        </vertices>
        <triangles>
          ${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`;
            meshObjects.push(meshContent);
        }
    });
    
    // Build the complete 3MF XML structure
    const xml3mf = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="0">
      ${materials.join('\n      ')}
    </basematerials:basematerials>
${meshObjects.join('\n')}
  </resources>
  <build>
${image.partList.map((_, idx) => `    <item objectid="${idx + 1}" />`).join('\n')}
  </build>
</model>`;
    
    return xml3mf;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
