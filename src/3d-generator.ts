import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pixelHeight: number; // Height of each pixel in mm
    pixelWidth: number; // Width/depth of each pixel in mm
}

/**
 * Generate 3MF file with separate material shapes for each color
 */
export async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    const { pixelWidth, pixelHeight } = settings;
    
    // Build 3MF XML structure
    let materials = '';
    let objects = '';
    let items = '';
    
    // Create materials for each color
    image.partList.forEach((part, index) => {
        const color = part.target;
        const hexColor = colorEntryToHex(color).substring(1); // Remove #
        materials += `    <basematerials id="${index + 1}">
      <base name="${color.name}" displaycolor="#${hexColor}" />
    </basematerials>\n`;
    });
    
    let objectId = 1;
    
    // Create mesh for each color
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexIndex = 0;
        
        // Find all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    // Create a box for this pixel
                    const x0 = x * pixelWidth;
                    const y0 = y * pixelWidth;
                    const x1 = (x + 1) * pixelWidth;
                    const y1 = (y + 1) * pixelWidth;
                    const z0 = 0;
                    const z1 = pixelHeight;
                    
                    // 8 vertices of the box
                    const v = vertexIndex;
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
                    // Bottom face
                    triangles.push(`<triangle v1="${v}" v2="${v+2}" v3="${v+1}" />`);
                    triangles.push(`<triangle v1="${v}" v2="${v+3}" v3="${v+2}" />`);
                    // Top face
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" />`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" />`);
                    // Front face
                    triangles.push(`<triangle v1="${v}" v2="${v+1}" v3="${v+5}" />`);
                    triangles.push(`<triangle v1="${v}" v2="${v+5}" v3="${v+4}" />`);
                    // Back face
                    triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}" />`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}" />`);
                    // Left face
                    triangles.push(`<triangle v1="${v+3}" v2="${v}" v3="${v+4}" />`);
                    triangles.push(`<triangle v1="${v+3}" v2="${v+4}" v3="${v+7}" />`);
                    // Right face
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" />`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" />`);
                    
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            objects += `  <object id="${objectId}" type="model">
    <mesh>
      <vertices>
${vertices.join('\n        ')}
      </vertices>
      <triangles>
${triangles.join('\n        ')}
      </triangles>
    </mesh>
  </object>\n`;
            
            items += `    <item objectid="${objectId}" />\n`;
            objectId++;
        }
    }
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${materials}${objects}  </resources>
  <build>
${items}  </build>
</model>`;
    
    return new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

/**
 * Generate OpenSCAD masks format (ZIP file with images and .scad file)
 */
export async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings): Promise<Blob> {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
        throw new Error("JSZip library not loaded");
    }
    
    const zip = new JSZip();
    const { pixelWidth, pixelHeight } = settings;
    
    // Create a monochrome image for each color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    let scadContent = `// OpenSCAD file for pixel art
// Generated by firaga.io
pixel_width = ${pixelWidth};
pixel_height = ${pixelHeight};

`;
    
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const part = image.partList[partIndex];
        
        // Create black and white image for this color
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        ctx.fillStyle = 'black';
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to PNG blob
        const imageData = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        const filename = `color_${partIndex}_${sanitizeFilename(part.target.name)}.png`;
        zip.file(filename, imageData);
        
        // Add to SCAD file
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        scadContent += `// ${part.target.name} (${part.count} pixels)
color([${r}, ${g}, ${b}])
  surface(file = "${filename}", center = true, invert = true)
    scale([pixel_width / ${image.width}, pixel_width / ${image.height}, pixel_height / 255]);

`;
    }
    
    zip.file('pixel_art.scad', scadContent);
    
    return await zip.generateAsync({ type: 'blob' });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Load JSZip library if needed
 */
export async function ensureJSZipLoaded(): Promise<void> {
    if ((window as any).JSZip) {
        return;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}
