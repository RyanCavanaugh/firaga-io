import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad-masks";
    filename: string;
    pixelHeight: number;
    baseHeight: number;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCADMasks(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    // Generate 3MF file with separate material shapes for each color
    const xml = create3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadFile(blob, `${settings.filename}.3mf`);
}

function create3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Build materials section
    let materialsXML = '';
    const colorMap = new Map<number, number>();
    let materialId = 1;
    
    partList.forEach((part, index) => {
        if (part) {
            const hex = colorEntryToHex(part).substring(1); // Remove #
            materialsXML += `    <basematerials:base name="${part.name}" displaycolor="#${hex}" />\n`;
            colorMap.set(index, materialId);
            materialId++;
        }
    });
    
    // Build mesh vertices and triangles for each color
    let meshesXML = '';
    let meshId = 1;
    
    partList.forEach((part, colorIndex) => {
        if (!part) return;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels with this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a box for this pixel
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // Add 8 vertices for the box
                    const startIdx = vertexIndex;
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // Add 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push(`      <triangle v1="${startIdx}" v2="${startIdx + 1}" v3="${startIdx + 2}" />`);
                    triangles.push(`      <triangle v1="${startIdx}" v2="${startIdx + 2}" v3="${startIdx + 3}" />`);
                    // Top face
                    triangles.push(`      <triangle v1="${startIdx + 4}" v2="${startIdx + 6}" v3="${startIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${startIdx + 4}" v2="${startIdx + 7}" v3="${startIdx + 6}" />`);
                    // Front face
                    triangles.push(`      <triangle v1="${startIdx}" v2="${startIdx + 4}" v3="${startIdx + 5}" />`);
                    triangles.push(`      <triangle v1="${startIdx}" v2="${startIdx + 5}" v3="${startIdx + 1}" />`);
                    // Back face
                    triangles.push(`      <triangle v1="${startIdx + 2}" v2="${startIdx + 6}" v3="${startIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${startIdx + 2}" v2="${startIdx + 7}" v3="${startIdx + 3}" />`);
                    // Left face
                    triangles.push(`      <triangle v1="${startIdx}" v2="${startIdx + 3}" v3="${startIdx + 7}" />`);
                    triangles.push(`      <triangle v1="${startIdx}" v2="${startIdx + 7}" v3="${startIdx + 4}" />`);
                    // Right face
                    triangles.push(`      <triangle v1="${startIdx + 1}" v2="${startIdx + 5}" v3="${startIdx + 6}" />`);
                    triangles.push(`      <triangle v1="${startIdx + 1}" v2="${startIdx + 6}" v3="${startIdx + 2}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const matId = colorMap.get(colorIndex);
            meshesXML += `  <object id="${meshId}" type="model">\n`;
            meshesXML += `    <mesh>\n`;
            meshesXML += `    <vertices>\n${vertices.join('\n')}\n    </vertices>\n`;
            meshesXML += `    <triangles>\n${triangles.join('\n')}\n    </triangles>\n`;
            meshesXML += `    </mesh>\n`;
            meshesXML += `  </object>\n`;
            meshId++;
        }
    });
    
    // Build the complete 3MF XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <metadata name="Title">${settings.filename}</metadata>
  <metadata name="Designer">firaga.io</metadata>
  <resources>
    <basematerials:basematerials id="1">
${materialsXML}
    </basematerials:basematerials>
${meshesXML}
  </resources>
  <build>
    ${Array.from({ length: meshId - 1 }, (_, i) => `<item objectid="${i + 2}" />`).join('\n    ')}
  </build>
</model>`;
    
    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings) {
    // Create a zip file with:
    // - one black/white image per color
    // - an OpenSCAD file that combines them
    
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { width, height, pixels, partList } = image;
    const { pixelHeight, baseHeight } = settings;
    
    // Create a canvas for generating mask images
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Generate one mask image per color
    const colorFiles: string[] = [];
    partList.forEach((part, colorIndex) => {
        if (!part) return;
        
        // Clear canvas to white
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
        
        // Convert to PNG and add to zip
        const filename = `color_${colorIndex}_${sanitizeFilename(part.name)}.png`;
        colorFiles.push(filename);
        
        canvas.toBlob((blob) => {
            if (blob) {
                zip.file(filename, blob);
            }
        });
    });
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADContent(colorFiles, partList, width, height, pixelHeight, baseHeight);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download zip
    setTimeout(async () => {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, `${settings.filename}_openscad.zip`);
    }, 500);
}

function generateOpenSCADContent(
    colorFiles: string[],
    partList: any[],
    width: number,
    height: number,
    pixelHeight: number,
    baseHeight: number
): string {
    let scad = `// Generated by firaga.io
// Image dimensions: ${width} x ${height}

pixel_height = ${pixelHeight};
base_height = ${baseHeight};

`;
    
    colorFiles.forEach((filename, index) => {
        const part = partList.find((p, i) => p && colorFiles[index].includes(`color_${i}_`));
        const colorHex = part ? colorEntryToHex(part) : '#000000';
        const [r, g, b] = hexToRgb(colorHex);
        
        scad += `// Color: ${part?.name || 'Unknown'}
color([${r / 255}, ${g / 255}, ${b / 255}])
  surface(file = "${filename}", center = true, invert = true);

`;
    });
    
    scad += `// Combine all layers
union() {
${colorFiles.map((filename, i) => `  translate([0, 0, ${i * 0.1}]) surface(file = "${filename}", center = true, invert = true);`).join('\n')}
}
`;
    
    return scad;
}

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_');
}

function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip(): Promise<any> {
    // Load JSZip from CDN if not already loaded
    if ((window as any).JSZip) {
        return (window as any).JSZip;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
