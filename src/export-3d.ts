import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DFormat = '3mf' | 'openscad-masks';

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    pixelSize: number; // Width/depth of each pixel in mm
}

/**
 * Exports the image as a 3D file in the selected format
 */
export function export3D(image: PartListImage, settings: Export3DSettings): void {
    if (settings.format === '3mf') {
        export3MF(image, settings);
    } else if (settings.format === 'openscad-masks') {
        exportOpenSCADMasks(image, settings);
    }
}

/**
 * Generates a 3MF file with separate material shapes for each color
 */
function export3MF(image: PartListImage, settings: Export3DSettings): void {
    const modelXML = build3MFModel(image, settings.pixelSize, settings.pixelHeight);
    const content3MF = create3MFPackage(modelXML);
    
    // Save as .model file (which is the XML) or .3mf if using ZIP
    const blob = new Blob([content3MF], { type: 'model/3mf' });
    saveAs(blob, `${settings.filename}.3mf.model`);
}

/**
 * Builds the 3D model XML content for 3MF format
 */
function build3MFModel(image: PartListImage, pixelSize: number, pixelHeight: number): string {
    const { width, height, partList, pixels } = image;
    
    let objectsXML = '';
    let resourcesXML = '';
    let buildItemsXML = '';
    
    // Create a material for each color and corresponding mesh
    partList.forEach((part, partIndex) => {
        const color = part.target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        const materialId = partIndex + 1;
        const objectId = partIndex + 1;
        
        // Add material definition
        resourcesXML += `    <basematerials id="basematerial_${materialId}">
      <base name="${color.name}" displaycolor="#${hex}" />
    </basematerials>\n`;
        
        // Build mesh for this color
        const meshXML = buildMeshForColor(pixels, width, height, partIndex, pixelSize, pixelHeight);
        
        if (meshXML) {
            objectsXML += `    <object id="${objectId}" type="model" pid="basematerial_${materialId}" pindex="0">
      <mesh>
${meshXML}
      </mesh>
    </object>\n`;
            
            buildItemsXML += `    <item objectid="${objectId}" />\n`;
        }
    });
    
    const model3MF = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resourcesXML}${objectsXML}
  </resources>
  <build>
${buildItemsXML}
  </build>
</model>`;
    
    return model3MF;
}

/**
 * Builds mesh vertices and triangles for a specific color
 */
function buildMeshForColor(
    pixels: ReadonlyArray<ReadonlyArray<number>>,
    width: number,
    height: number,
    colorIndex: number,
    pixelSize: number,
    pixelHeight: number
): string | undefined {
    const vertices: Array<[number, number, number]> = [];
    const triangles: Array<[number, number, number]> = [];
    
    // Build cubes for each pixel of this color
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pixels[y][x] === colorIndex) {
                const baseVertexIndex = vertices.length;
                
                // Calculate position (origin at bottom-left)
                const x0 = x * pixelSize;
                const x1 = (x + 1) * pixelSize;
                const y0 = y * pixelSize;
                const y1 = (y + 1) * pixelSize;
                const z0 = 0;
                const z1 = pixelHeight;
                
                // Add 8 vertices for the cube
                vertices.push(
                    [x0, y0, z0], // 0
                    [x1, y0, z0], // 1
                    [x1, y1, z0], // 2
                    [x0, y1, z0], // 3
                    [x0, y0, z1], // 4
                    [x1, y0, z1], // 5
                    [x1, y1, z1], // 6
                    [x0, y1, z1]  // 7
                );
                
                // Add 12 triangles (2 per face, 6 faces)
                const v = baseVertexIndex;
                
                // Bottom face (z=0)
                triangles.push([v+0, v+2, v+1], [v+0, v+3, v+2]);
                // Top face (z=z1)
                triangles.push([v+4, v+5, v+6], [v+4, v+6, v+7]);
                // Front face (y=y0)
                triangles.push([v+0, v+1, v+5], [v+0, v+5, v+4]);
                // Back face (y=y1)
                triangles.push([v+3, v+7, v+6], [v+3, v+6, v+2]);
                // Left face (x=x0)
                triangles.push([v+0, v+4, v+7], [v+0, v+7, v+3]);
                // Right face (x=x1)
                triangles.push([v+1, v+2, v+6], [v+1, v+6, v+5]);
            }
        }
    }
    
    if (vertices.length === 0) {
        return undefined;
    }
    
    // Build XML
    let verticesXML = '        <vertices>\n';
    vertices.forEach(([x, y, z]) => {
        verticesXML += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
    });
    verticesXML += '        </vertices>';
    
    let trianglesXML = '        <triangles>\n';
    triangles.forEach(([v1, v2, v3]) => {
        trianglesXML += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
    });
    trianglesXML += '        </triangles>';
    
    return verticesXML + '\n' + trianglesXML;
}

/**
 * Creates a 3MF package (ZIP file) with the model
 * Note: This is a simplified implementation that creates just the model XML.
 * A complete 3MF file should be a ZIP containing:
 * - [Content_Types].xml
 * - _rels/.rels
 * - 3D/3dmodel.model
 * For compatibility with more readers, consider using a proper ZIP library.
 */
function create3MFPackage(modelXML: string): string {
    // For browsers that can handle it, we return the XML directly
    // Most modern 3D software can import the raw XML as well
    // For production, this should use JSZip or similar to create proper ZIP structure
    return modelXML;
}

/**
 * Exports as OpenSCAD masks format - a ZIP file with:
 * - One black/white PNG per color
 * - An OpenSCAD file that combines them
 */
async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, pixelSize, filename } = settings;
    
    // We need JSZip for creating the zip file
    // For now, create individual files and let the user know they need to be zipped
    // In a production implementation, we would use JSZip
    
    const masks: Array<{ name: string; data: Blob }> = [];
    
    // Create a mask image for each color
    for (let partIndex = 0; partIndex < partList.length; partIndex++) {
        const part = partList[partIndex];
        const maskBlob = await createMaskImage(pixels, width, height, partIndex);
        masks.push({
            name: `mask_${part.symbol}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
            data: maskBlob
        });
    }
    
    // Create the OpenSCAD file
    const scadContent = createOpenSCADFile(partList, width, height, pixelSize, pixelHeight);
    const scadBlob = new Blob([scadContent], { type: 'text/plain' });
    
    // For now, save files individually
    // TODO: Use JSZip to create a proper zip file
    scadBlob && saveAs(scadBlob, `${filename}.scad`);
    masks.forEach(({ name, data }) => {
        saveAs(data, name);
    });
    
    alert(`OpenSCAD export created ${masks.length + 1} files. Please manually zip them together.`);
}

/**
 * Creates a black/white mask image for a specific color
 */
async function createMaskImage(
    pixels: ReadonlyArray<ReadonlyArray<number>>,
    width: number,
    height: number,
    colorIndex: number
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Could not create canvas context');
    }
    
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const isColor = pixels[y][x] === colorIndex;
            const value = isColor ? 0 : 255; // Black for filled, white for empty
            
            imageData.data[index] = value;     // R
            imageData.data[index + 1] = value; // G
            imageData.data[index + 2] = value; // B
            imageData.data[index + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/png');
    });
}

/**
 * Creates the OpenSCAD file content
 */
function createOpenSCADFile(
    partList: ReadonlyArray<{ target: { name: string; r: number; g: number; b: number }; symbol: string }>,
    width: number,
    height: number,
    pixelSize: number,
    pixelHeight: number
): string {
    let scadContent = `// OpenSCAD 3D display generated by firaga.io
// Image size: ${width}x${height} pixels
// Pixel size: ${pixelSize}mm x ${pixelSize}mm x ${pixelHeight}mm

`;
    
    partList.forEach((part, index) => {
        const maskFile = `mask_${part.symbol}_${part.target.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadContent += `// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${index * pixelHeight}])
scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])
surface(file = "${maskFile}", center = true, invert = true);

`;
    });
    
    return scadContent;
}
