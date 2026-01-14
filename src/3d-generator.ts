import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const saveAs: typeof import('file-saver').saveAs;
declare const JSZip: typeof import('jszip');

export function make3mf(image: PartListImage, filename: string) {
    // Generate 3MF XML
    const xml = generate3mfXml(image);
    
    // Create blob from XML
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmodel+xml' });
    
    // Download
    saveAs(blob, `${filename}.3mf`);
}

export async function makeOpenScadZip(image: PartListImage, filename: string) {
    // Load JSZip dynamically
    await loadJsZip();
    const zip = new JSZip();
    
    // Generate one image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const maskImageData = createMaskImage(image, colorIdx);
        const canvas = document.createElement('canvas');
        canvas.width = maskImageData.width;
        canvas.height = maskImageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(maskImageData, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(`color_${colorIdx}.png`, base64, { base64: true });
    }
    
    // Generate OpenSCAD script
    const scadCode = generateOpenScadScript(image);
    zip.file('model.scad', scadCode);
    
    // Generate zip
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}.zip`);
}

function generate3mfXml(image: PartListImage): string {
    // Start with 3MF header
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2013/12" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/02" requiredextensions="p">
  <metadata name="Application">firaga.io</metadata>
  <resources>
    <basematerials id="1">
`;
    
    // Add materials (one per color in the part list)
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).substring(1); // Remove '#'
        const colorName = escapeXml(color.name);
        xml += `      <base name="${colorName}" displaycolor="${hex}FF" />\n`;
    }
    
    xml += `    </basematerials>
  </resources>
  <objects>
`;
    
    // Create one object per color with its mesh
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const mesh = generateTriangleMesh(image, colorIdx);
        xml += `    <object id="${colorIdx + 2}" type="model">
      <mesh>
        <vertices>
`;
        
        // Add vertices
        for (const v of mesh.vertices) {
            xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
        }
        
        xml += `        </vertices>
        <triangles>
`;
        
        // Add triangles
        for (const tri of mesh.triangles) {
            xml += `          <triangle v1="${tri[0]}" v2="${tri[1]}" v3="${tri[2]}" p1="${colorIdx + 1}" />\n`;
        }
        
        xml += `        </triangles>
      </mesh>
    </object>
`;
    }
    
    xml += `  </objects>
  <build>
`;
    
    // Reference all objects in the build
    for (let i = 0; i < image.partList.length; i++) {
        xml += `    <item objectid="${i + 2}" />\n`;
    }
    
    xml += `  </build>
</model>`;
    
    return xml;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generateTriangleMesh(image: PartListImage, colorIdx: number): { vertices: number[][]; triangles: number[][] } {
    const vertices: number[][] = [];
    const triangles: number[][] = [];
    const vertexMap = new Map<string, number>();
    
    const height = 10; // Height in mm
    const pixelSize = 10; // Pixel size in mm
    
    // Create a simple quad for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] !== colorIdx) continue;
            
            // Create a simple raised quad (4 vertices for top, shared with neighbors for bottom)
            const x0 = x * pixelSize;
            const y0 = y * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y1 = (y + 1) * pixelSize;
            
            // Create vertices only for this pixel's quad
            // Top corners (at height)
            const vTopTL = addVertex([x0, y0, height]);
            const vTopTR = addVertex([x1, y0, height]);
            const vTopBR = addVertex([x1, y1, height]);
            const vTopBL = addVertex([x0, y1, height]);
            
            // Bottom corners (at z=0)
            const vBotTL = addVertex([x0, y0, 0]);
            const vBotTR = addVertex([x1, y0, 0]);
            const vBotBR = addVertex([x1, y1, 0]);
            const vBotBL = addVertex([x0, y1, 0]);
            
            // Top face (two triangles)
            triangles.push([vTopTL, vTopTR, vTopBR]);
            triangles.push([vTopTL, vTopBR, vTopBL]);
            
            // Bottom face
            triangles.push([vBotTL, vBotBR, vBotTR]);
            triangles.push([vBotTL, vBotBL, vBotBR]);
            
            // Side faces
            // Front (y=0)
            triangles.push([vTopTL, vBotTL, vBotTR]);
            triangles.push([vTopTL, vBotTR, vTopTR]);
            
            // Right (x=1)
            triangles.push([vTopTR, vBotTR, vBotBR]);
            triangles.push([vTopTR, vBotBR, vTopBR]);
            
            // Back (y=1)
            triangles.push([vTopBR, vBotBR, vBotBL]);
            triangles.push([vTopBR, vBotBL, vTopBL]);
            
            // Left (x=0)
            triangles.push([vTopBL, vBotBL, vBotTL]);
            triangles.push([vTopBL, vBotTL, vTopTL]);
        }
    }
    
    return { vertices, triangles };
    
    function addVertex(v: number[]): number {
        const key = v.join(',');
        let idx = vertexMap.get(key);
        if (idx === undefined) {
            idx = vertices.length;
            vertices.push(v);
            vertexMap.set(key, idx);
        }
        return idx;
    }
}

function createMaskImage(image: PartListImage, colorIdx: number): ImageData {
    const imageData = new ImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIdx;
            
            // White for this color, black otherwise
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    return imageData;
}

function generateOpenScadScript(image: PartListImage): string {
    const code = `// Generated by firaga.io
// 3D model created from ${image.width}x${image.height} pixel image
// Load heightmap images and combine them into a 3D model
//
// To use in OpenSCAD:
// 1. Open this file in OpenSCAD
// 2. Extract all images from the zip to the same directory
// 3. Use View > Render (F6) to generate the 3D model
//
// Settings
pixel_height = 2;  // Height per pixel in mm
spacing = 0.5;     // Spacing between color layers in mm

// Render all color layers
union() {
`;
    
    let result = code;
    
    // Stack each color at a different height
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const zOffset = (i * (1 + spacing / pixel_height)).toFixed(2);
        result += `    // Color ${i}: ${color.name} (RGB: ${color.r}, ${color.g}, ${color.b})
    translate([0, 0, ${zOffset}]) 
    color([${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}])
    surface(file = "color_${i}.png", center = false, invert = true, convexity = 5);
`;
    }
    
    result += '}\n';
    return result;
}

async function loadJsZip() {
    return new Promise<void>((resolve) => {
        if ((window as any).JSZip) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}
