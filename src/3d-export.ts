import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type Export3DSettings = {
    format: "3mf" | "openscad";
    heightMm: number;
    baseHeightMm: number;
    pixelSizeMm: number;
    filename: string;
};

export function export3D(image: PartListImage, settings: Export3DSettings): void {
    if (settings.format === "3mf") {
        export3MF(image, settings);
    } else {
        exportOpenSCAD(image, settings);
    }
}

function export3MF(image: PartListImage, settings: Export3DSettings): void {
    const xml = generate3MF(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MF(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelSizeMm, heightMm, baseHeightMm } = settings;

    let objectsXML = '';
    let resourcesXML = '';
    let itemsXML = '';
    
    // Generate base plate
    const baseVertices: string[] = [];
    const baseTriangles: string[] = [];
    
    // Base vertices (bottom face)
    baseVertices.push(`<vertex x="0" y="0" z="0" />`);
    baseVertices.push(`<vertex x="${width * pixelSizeMm}" y="0" z="0" />`);
    baseVertices.push(`<vertex x="${width * pixelSizeMm}" y="${height * pixelSizeMm}" z="0" />`);
    baseVertices.push(`<vertex x="0" y="${height * pixelSizeMm}" z="0" />`);
    
    // Base vertices (top face)
    baseVertices.push(`<vertex x="0" y="0" z="${baseHeightMm}" />`);
    baseVertices.push(`<vertex x="${width * pixelSizeMm}" y="0" z="${baseHeightMm}" />`);
    baseVertices.push(`<vertex x="${width * pixelSizeMm}" y="${height * pixelSizeMm}" z="${baseHeightMm}" />`);
    baseVertices.push(`<vertex x="0" y="${height * pixelSizeMm}" z="${baseHeightMm}" />`);
    
    // Base triangles - bottom
    baseTriangles.push(`<triangle v1="0" v2="2" v3="1" />`);
    baseTriangles.push(`<triangle v1="0" v2="3" v3="2" />`);
    // Base triangles - top
    baseTriangles.push(`<triangle v1="4" v2="5" v3="6" />`);
    baseTriangles.push(`<triangle v1="4" v2="6" v3="7" />`);
    // Base triangles - sides
    baseTriangles.push(`<triangle v1="0" v2="1" v3="5" />`);
    baseTriangles.push(`<triangle v1="0" v2="5" v3="4" />`);
    baseTriangles.push(`<triangle v1="1" v2="2" v3="6" />`);
    baseTriangles.push(`<triangle v1="1" v2="6" v3="5" />`);
    baseTriangles.push(`<triangle v1="2" v2="3" v3="7" />`);
    baseTriangles.push(`<triangle v1="2" v2="7" v3="6" />`);
    baseTriangles.push(`<triangle v1="3" v2="0" v3="4" />`);
    baseTriangles.push(`<triangle v1="3" v2="4" v3="7" />`);
    
    resourcesXML += `    <basematerials id="1">\n`;
    resourcesXML += `      <base name="Base" displaycolor="#808080" />\n`;
    
    let materialId = 2;
    partList.forEach((part, partIndex) => {
        const colorHex = rgbToHex(part.target.r, part.target.g, part.target.b);
        resourcesXML += `      <base name="${escapeXML(part.target.name)}" displaycolor="${colorHex}" />\n`;
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIndex) {
                    const x0 = x * pixelSizeMm;
                    const y0 = y * pixelSizeMm;
                    const x1 = (x + 1) * pixelSizeMm;
                    const y1 = (y + 1) * pixelSizeMm;
                    const z0 = baseHeightMm;
                    const z1 = baseHeightMm + heightMm;
                    
                    const base = vertexIndex;
                    
                    // Bottom face vertices
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}" />`);
                    
                    // Top face vertices
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}" />`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}" />`);
                    
                    // Top face triangles
                    triangles.push(`<triangle v1="${base + 4}" v2="${base + 5}" v3="${base + 6}" />`);
                    triangles.push(`<triangle v1="${base + 4}" v2="${base + 6}" v3="${base + 7}" />`);
                    
                    // Side triangles (only if no neighbor)
                    // Left side
                    if (x === 0 || pixels[y][x - 1] !== partIndex) {
                        triangles.push(`<triangle v1="${base + 0}" v2="${base + 4}" v3="${base + 7}" />`);
                        triangles.push(`<triangle v1="${base + 0}" v2="${base + 7}" v3="${base + 3}" />`);
                    }
                    // Right side
                    if (x === width - 1 || pixels[y][x + 1] !== partIndex) {
                        triangles.push(`<triangle v1="${base + 1}" v2="${base + 2}" v3="${base + 6}" />`);
                        triangles.push(`<triangle v1="${base + 1}" v2="${base + 6}" v3="${base + 5}" />`);
                    }
                    // Front side
                    if (y === 0 || pixels[y - 1][x] !== partIndex) {
                        triangles.push(`<triangle v1="${base + 0}" v2="${base + 1}" v3="${base + 5}" />`);
                        triangles.push(`<triangle v1="${base + 0}" v2="${base + 5}" v3="${base + 4}" />`);
                    }
                    // Back side
                    if (y === height - 1 || pixels[y + 1][x] !== partIndex) {
                        triangles.push(`<triangle v1="${base + 2}" v2="${base + 3}" v3="${base + 7}" />`);
                        triangles.push(`<triangle v1="${base + 2}" v2="${base + 7}" v3="${base + 6}" />`);
                    }
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objectsXML += `    <object id="${materialId}" type="model" pid="1" pindex="${materialId - 1}">\n`;
            objectsXML += `      <mesh>\n`;
            objectsXML += `        <vertices>\n`;
            objectsXML += vertices.map(v => `          ${v}`).join('\n') + '\n';
            objectsXML += `        </vertices>\n`;
            objectsXML += `        <triangles>\n`;
            objectsXML += triangles.map(t => `          ${t}`).join('\n') + '\n';
            objectsXML += `        </triangles>\n`;
            objectsXML += `      </mesh>\n`;
            objectsXML += `    </object>\n`;
            
            itemsXML += `    <item objectid="${materialId}" />\n`;
            materialId++;
        }
    });
    
    resourcesXML += `    </basematerials>\n`;
    
    // Add base object
    objectsXML = `    <object id="${materialId}" type="model" pid="1" pindex="0">\n` +
        `      <mesh>\n` +
        `        <vertices>\n` +
        baseVertices.map(v => `          ${v}`).join('\n') + '\n' +
        `        </vertices>\n` +
        `        <triangles>\n` +
        baseTriangles.map(t => `          ${t}`).join('\n') + '\n' +
        `        </triangles>\n` +
        `      </mesh>\n` +
        `    </object>\n` + objectsXML;
    
    itemsXML += `    <item objectid="${materialId}" />\n`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resourcesXML}${objectsXML}  </resources>
  <build>
${itemsXML}  </build>
</model>`;
}

function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): void {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
        loadJSZipThen(() => exportOpenSCAD(image, settings));
        return;
    }
    
    const zip = new JSZip();
    const { width, height, partList, pixels } = image;
    
    // Generate masks for each color
    partList.forEach((part, partIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (pixels[y][x] === partIndex) {
                    imageData.data[idx] = 255;     // R
                    imageData.data[idx + 1] = 255; // G
                    imageData.data[idx + 2] = 255; // B
                    imageData.data[idx + 3] = 255; // A
                } else {
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                    imageData.data[idx + 3] = 255;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1];
        zip.file(`color_${partIndex}_${sanitizeFilename(part.target.name)}.png`, base64Data, { base64: true });
    });
    
    // Generate OpenSCAD file
    let scadContent = `// Generated from ${settings.filename}\n`;
    scadContent += `// Pixel size: ${settings.pixelSizeMm}mm\n`;
    scadContent += `// Height: ${settings.heightMm}mm\n`;
    scadContent += `// Base height: ${settings.baseHeightMm}mm\n\n`;
    
    scadContent += `pixel_size = ${settings.pixelSizeMm};\n`;
    scadContent += `height = ${settings.heightMm};\n`;
    scadContent += `base_height = ${settings.baseHeightMm};\n`;
    scadContent += `image_width = ${width};\n`;
    scadContent += `image_height = ${height};\n\n`;
    
    // Base plate
    scadContent += `// Base plate\n`;
    scadContent += `color([0.5, 0.5, 0.5])\n`;
    scadContent += `  cube([image_width * pixel_size, image_height * pixel_size, base_height]);\n\n`;
    
    // Color layers
    partList.forEach((part, partIndex) => {
        const r = (part.target.r / 255).toFixed(3);
        const g = (part.target.g / 255).toFixed(3);
        const b = (part.target.b / 255).toFixed(3);
        
        scadContent += `// ${part.target.name}\n`;
        scadContent += `translate([0, 0, base_height])\n`;
        scadContent += `  color([${r}, ${g}, ${b}])\n`;
        scadContent += `    surface(file = "color_${partIndex}_${sanitizeFilename(part.target.name)}.png",\n`;
        scadContent += `            center = false,\n`;
        scadContent += `            invert = true,\n`;
        scadContent += `            convexity = 5)\n`;
        scadContent += `      scale([pixel_size, pixel_size, height / 255]);\n\n`;
    });
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, `${settings.filename}_openscad.zip`);
    });
}

function loadJSZipThen(callback: () => void): void {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => callback();
        tag.src = "https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        callback();
    }
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(str: string): string {
    return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
