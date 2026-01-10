import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export type Export3DFormat = "3mf" | "openscad";

export interface Export3DSettings {
    format: Export3DFormat;
    filename: string;
    pixelHeight: number; // Height of each pixel in mm
    baseThickness: number; // Thickness of the base in mm
}

export async function export3D(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

// 3MF format implementation
async function export3MF(image: PartListImage, settings: Export3DSettings) {
    const xml = generate3MFContent(image, settings);
    
    // 3MF is a zip file with specific structure
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Add required files for 3MF format
    zip.file("[Content_Types].xml", generateContentTypes());
    zip.file("_rels/.rels", generateRels());
    zip.file("3D/3dmodel.model", xml);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, settings: Export3DSettings): string {
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseThickness } = settings;
    
    let vertexId = 1;
    let triangleId = 1;
    const objects: string[] = [];
    
    // Create a separate object for each color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const color = partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        
        // Collect all pixels of this color and create cubes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    // Create a cube for this pixel
                    const cubeVertices = generateCubeVertices(x, y, pixelHeight, baseThickness);
                    const cubeTriangles = generateCubeTriangles(vertexId);
                    
                    vertices.push(...cubeVertices);
                    triangles.push(...cubeTriangles);
                    
                    vertexId += 8; // 8 vertices per cube
                }
            }
        }
        
        if (vertices.length > 0) {
            // Color in RGB format (0-1 range)
            const r = color.target.r / 255;
            const g = color.target.g / 255;
            const b = color.target.b / 255;
            
            objects.push(`
    <object id="${colorIndex + 2}" name="${color.target.name}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    // Build components list
    const components = objects.map((_, idx) => 
        `        <component objectid="${idx + 2}" />`
    ).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
    <object id="1" type="model">
      <components>
${components}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
}

function generateCubeVertices(x: number, y: number, height: number, baseThickness: number): string[] {
    // Each pixel is 1mm x 1mm, positioned at (x, y)
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = 0;
    const z1 = baseThickness + height;
    
    return [
        `          <vertex x="${x0}" y="${y0}" z="${z0}" />`,
        `          <vertex x="${x1}" y="${y0}" z="${z0}" />`,
        `          <vertex x="${x1}" y="${y1}" z="${z0}" />`,
        `          <vertex x="${x0}" y="${y1}" z="${z0}" />`,
        `          <vertex x="${x0}" y="${y0}" z="${z1}" />`,
        `          <vertex x="${x1}" y="${y0}" z="${z1}" />`,
        `          <vertex x="${x1}" y="${y1}" z="${z1}" />`,
        `          <vertex x="${x0}" y="${y1}" z="${z1}" />`
    ];
}

function generateCubeTriangles(startVertex: number): string[] {
    const v = startVertex;
    return [
        // Bottom face
        `          <triangle v1="${v}" v2="${v + 2}" v3="${v + 1}" />`,
        `          <triangle v1="${v}" v2="${v + 3}" v3="${v + 2}" />`,
        // Top face
        `          <triangle v1="${v + 4}" v2="${v + 5}" v3="${v + 6}" />`,
        `          <triangle v1="${v + 4}" v2="${v + 6}" v3="${v + 7}" />`,
        // Front face
        `          <triangle v1="${v}" v2="${v + 1}" v3="${v + 5}" />`,
        `          <triangle v1="${v}" v2="${v + 5}" v3="${v + 4}" />`,
        // Back face
        `          <triangle v1="${v + 3}" v2="${v + 7}" v3="${v + 6}" />`,
        `          <triangle v1="${v + 3}" v2="${v + 6}" v3="${v + 2}" />`,
        // Left face
        `          <triangle v1="${v}" v2="${v + 4}" v3="${v + 7}" />`,
        `          <triangle v1="${v}" v2="${v + 7}" v3="${v + 3}" />`,
        // Right face
        `          <triangle v1="${v + 1}" v2="${v + 2}" v3="${v + 6}" />`,
        `          <triangle v1="${v + 1}" v2="${v + 6}" v3="${v + 5}" />`
    ];
}

function generateContentTypes(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function generateRels(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
}

// OpenSCAD format implementation
async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { width, height, partList, pixels } = image;
    const { pixelHeight, baseThickness } = settings;
    
    // Create one monochrome image per color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const color = partList[colorIndex];
        const imageData = createMaskImage(image, colorIndex);
        const blob = await imageDataToBlob(imageData);
        const sanitizedName = sanitizeFilename(color.target.name);
        zip.file(`mask_${colorIndex}_${sanitizedName}.png`, blob);
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function createMaskImage(image: PartListImage, colorIndex: number): ImageData {
    const { width, height, pixels } = image;
    const imageData = new ImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isColor = pixels[y][x] === colorIndex;
            
            // White (255) for this color, black (0) for others
            const value = isColor ? 255 : 0;
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    return imageData;
}

function generateOpenSCADFile(image: PartListImage, settings: Export3DSettings): string {
    const { partList } = image;
    const { pixelHeight, baseThickness } = settings;
    
    let scadCode = `// Generated OpenSCAD file for ${settings.filename}
// Each color layer is represented as a heightmap

`;
    
    // Add color modules
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const color = partList[colorIndex];
        const sanitizedName = sanitizeFilename(color.target.name);
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        
        scadCode += `module layer_${colorIndex}() {
  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  translate([0, 0, ${baseThickness}])
  scale([1, 1, ${pixelHeight}])
  surface(file = "mask_${colorIndex}_${sanitizedName}.png", center = false, invert = true);
}

`;
    }
    
    // Combine all layers
    scadCode += `// Combine all layers
union() {
`;
    
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        scadCode += `  layer_${colorIndex}();\n`;
    }
    
    scadCode += `}
`;
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    });
}

// Dynamically load JSZip library
let jsZipLoaded = false;
let jsZipPromise: Promise<any> | null = null;

async function loadJSZip(): Promise<any> {
    if (jsZipLoaded) {
        return (window as any).JSZip;
    }
    
    if (jsZipPromise) {
        return jsZipPromise;
    }
    
    jsZipPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            jsZipLoaded = true;
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
    
    return jsZipPromise;
}
