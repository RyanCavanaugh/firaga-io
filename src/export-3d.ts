import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

export type Export3DSettings = {
    format: '3mf' | 'openscad';
    height: number;
    baseHeight: number;
    pixelSize: number;
};

/**
 * Export image as 3D file
 */
export function export3D(image: PartListImage, settings: Export3DSettings, filename: string): void {
    if (settings.format === '3mf') {
        export3MF(image, settings, filename);
    } else {
        exportOpenSCAD(image, settings, filename);
    }
}

/**
 * Generate 3MF triangle mesh with separate material shapes for each color
 */
function export3MF(image: PartListImage, settings: Export3DSettings, filename: string): void {
    const { width, height, partList, pixels } = image;
    const { height: pixelHeight, baseHeight, pixelSize } = settings;

    // Build 3MF XML content
    let modelXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
    modelXML += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    modelXML += '  <resources>\n';

    // Define materials
    modelXML += '    <basematerials id="1">\n';
    partList.forEach((part, idx) => {
        const color = colorEntryToHex(part.target).substring(1);
        modelXML += `      <base name="${escapeXml(part.target.name)}" displaycolor="#${color}" />\n`;
    });
    modelXML += '    </basematerials>\n';

    // Create base plate
    const baseVertices: string[] = [];
    const baseTriangles: string[] = [];
    const baseWidth = width * pixelSize;
    const baseDepth = height * pixelSize;

    // Base vertices (8 corners of a box)
    baseVertices.push(`      <vertex x="0" y="0" z="0" />`);
    baseVertices.push(`      <vertex x="${baseWidth}" y="0" z="0" />`);
    baseVertices.push(`      <vertex x="${baseWidth}" y="${baseDepth}" z="0" />`);
    baseVertices.push(`      <vertex x="0" y="${baseDepth}" z="0" />`);
    baseVertices.push(`      <vertex x="0" y="0" z="${baseHeight}" />`);
    baseVertices.push(`      <vertex x="${baseWidth}" y="0" z="${baseHeight}" />`);
    baseVertices.push(`      <vertex x="${baseWidth}" y="${baseDepth}" z="${baseHeight}" />`);
    baseVertices.push(`      <vertex x="0" y="${baseDepth}" z="${baseHeight}" />`);

    // Base triangles (12 triangles for a box)
    const baseFaces = [
        [0, 2, 1], [0, 3, 2], // bottom
        [4, 5, 6], [4, 6, 7], // top
        [0, 1, 5], [0, 5, 4], // front
        [1, 2, 6], [1, 6, 5], // right
        [2, 3, 7], [2, 7, 6], // back
        [3, 0, 4], [3, 4, 7]  // left
    ];
    baseFaces.forEach(face => {
        baseTriangles.push(`      <triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}" />`);
    });

    modelXML += '    <object id="2" type="model">\n';
    modelXML += '      <mesh>\n';
    modelXML += '        <vertices>\n';
    modelXML += baseVertices.join('\n') + '\n';
    modelXML += '        </vertices>\n';
    modelXML += '        <triangles>\n';
    modelXML += baseTriangles.join('\n') + '\n';
    modelXML += '        </triangles>\n';
    modelXML += '      </mesh>\n';
    modelXML += '    </object>\n';

    // Create pixel meshes for each color
    partList.forEach((part, materialIdx) => {
        const objectId = 3 + materialIdx;
        const cubes: Array<{ x: number; y: number }> = [];

        // Find all pixels of this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === materialIdx) {
                    cubes.push({ x, y });
                }
            }
        }

        if (cubes.length === 0) return;

        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexOffset = 0;

        cubes.forEach(cube => {
            const x0 = cube.x * pixelSize;
            const x1 = (cube.x + 1) * pixelSize;
            const y0 = cube.y * pixelSize;
            const y1 = (cube.y + 1) * pixelSize;
            const z0 = baseHeight;
            const z1 = baseHeight + pixelHeight;

            // 8 vertices for each cube
            vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
            vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
            vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
            vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
            vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
            vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
            vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
            vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);

            // 12 triangles for each cube
            const faces = [
                [0, 2, 1], [0, 3, 2], // bottom
                [4, 5, 6], [4, 6, 7], // top
                [0, 1, 5], [0, 5, 4], // front
                [1, 2, 6], [1, 6, 5], // right
                [2, 3, 7], [2, 7, 6], // back
                [3, 0, 4], [3, 4, 7]  // left
            ];

            faces.forEach(face => {
                triangles.push(`      <triangle v1="${vertexOffset + face[0]}" v2="${vertexOffset + face[1]}" v3="${vertexOffset + face[2]}" pid="1" p1="${materialIdx}" />`);
            });

            vertexOffset += 8;
        });

        modelXML += `    <object id="${objectId}" type="model">\n`;
        modelXML += '      <mesh>\n';
        modelXML += '        <vertices>\n';
        modelXML += vertices.join('\n') + '\n';
        modelXML += '        </vertices>\n';
        modelXML += '        <triangles>\n';
        modelXML += triangles.join('\n') + '\n';
        modelXML += '        </triangles>\n';
        modelXML += '      </mesh>\n';
        modelXML += '    </object>\n';
    });

    // Build component for assembly
    modelXML += '    <object id="1" type="model">\n';
    modelXML += '      <components>\n';
    modelXML += '        <component objectid="2" />\n';
    partList.forEach((_, idx) => {
        const objectId = 3 + idx;
        modelXML += `        <component objectid="${objectId}" />\n`;
    });
    modelXML += '      </components>\n';
    modelXML += '    </object>\n';

    modelXML += '  </resources>\n';
    modelXML += '  <build>\n';
    modelXML += '    <item objectid="1" />\n';
    modelXML += '  </build>\n';
    modelXML += '</model>\n';

    // Create 3MF zip structure
    create3MFZip(modelXML, filename);
}

/**
 * Generate OpenSCAD masks format (zip with images and .scad file)
 */
async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings, filename: string): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const { width, height, partList, pixels } = image;
    const { height: pixelHeight, baseHeight, pixelSize } = settings;

    // Generate one mask image per color
    const imagePromises = partList.map((part, idx) => 
        generateMaskImage(pixels, width, height, idx)
    );

    const maskImages = await Promise.all(imagePromises);

    // Add images to zip
    partList.forEach((part, idx) => {
        const maskFilename = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(maskFilename, maskImages[idx].split(',')[1], { base64: true });
    });

    // Generate OpenSCAD file
    let scadContent = '// Generated by firaga.io\n';
    scadContent += `// Image: ${width}x${height}\n`;
    scadContent += `// Pixel size: ${pixelSize}mm\n`;
    scadContent += `// Base height: ${baseHeight}mm\n`;
    scadContent += `// Pixel height: ${pixelHeight}mm\n\n`;

    scadContent += `pixel_size = ${pixelSize};\n`;
    scadContent += `base_height = ${baseHeight};\n`;
    scadContent += `pixel_height = ${pixelHeight};\n`;
    scadContent += `image_width = ${width};\n`;
    scadContent += `image_height = ${height};\n\n`;

    // Base plate
    scadContent += '// Base plate\n';
    scadContent += 'color([0.5, 0.5, 0.5])\n';
    scadContent += `cube([image_width * pixel_size, image_height * pixel_size, base_height]);\n\n`;

    // Add each color layer
    partList.forEach((part, idx) => {
        const maskFilename = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;

        scadContent += `// ${part.target.name} (${part.count} pixels)\n`;
        scadContent += `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])\n`;
        scadContent += 'translate([0, 0, base_height])\n';
        scadContent += `surface(file="${maskFilename}", center=false, invert=true);\n\n`;
    });

    scadContent += '// Alternative: Use linear_extrude with scale for heightmap effect\n';
    scadContent += '/*\n';
    partList.forEach((part, idx) => {
        const maskFilename = `mask_${idx}_${sanitizeFilename(part.target.name)}.png`;
        scadContent += `// ${part.target.name}\n`;
        scadContent += 'translate([0, 0, base_height])\n';
        scadContent += 'linear_extrude(height=pixel_height, scale=1)\n';
        scadContent += `  scale([pixel_size, pixel_size])\n`;
        scadContent += `    import("${maskFilename}");\n\n`;
    });
    scadContent += '*/\n';

    zip.file('model.scad', scadContent);

    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}.zip`);
}

/**
 * Generate a black/white mask image for a specific color index
 */
function generateMaskImage(
    pixels: ReadonlyArray<ReadonlyArray<number>>,
    width: number,
    height: number,
    colorIndex: number
): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        const imageData = ctx.createImageData(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const isMatch = pixels[y][x] === colorIndex;
                const value = isMatch ? 255 : 0;
                
                imageData.data[i] = value;     // R
                imageData.data[i + 1] = value; // G
                imageData.data[i + 2] = value; // B
                imageData.data[i + 3] = 255;   // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
    });
}

/**
 * Create 3MF zip file
 */
async function create3MFZip(modelXML: string, filename: string): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Add required 3MF files
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`);

    zip.file('3D/3dmodel.model', modelXML);

    const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
    });
    
    saveAs(blob, `${filename}.3mf`);
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Dynamically load JSZip library
 */
async function loadJSZip(): Promise<typeof import('jszip')> {
    // Check if already loaded
    if (typeof (window as any).JSZip !== 'undefined') {
        return (window as any).JSZip;
    }

    // Load from CDN
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
