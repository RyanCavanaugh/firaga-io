import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import { AppProps } from './types';
import { getPitch } from './utils';

export type Export3DFormat = '3mf' | 'openscad-masks';

export interface Export3DSettings {
    format: Export3DFormat;
    materialSize: AppProps["material"]["size"];
    filename: string;
}

/**
 * Generate and download 3D export file(s)
 */
export function export3D(image: PartListImage, settings: Export3DSettings): void {
    if (settings.format === '3mf') {
        export3MF(image, settings);
    } else {
        exportOpenSCADMasks(image, settings);
    }
}

/**
 * Generate 3MF file with separate material shapes for each color
 */
function export3MF(image: PartListImage, settings: Export3DSettings): void {
    const pitch = getPitch(settings.materialSize);
    const heightPerLayer = 2; // mm height per pixel layer
    
    // Build 3MF XML structure
    const xml = generate3MFContent(image, pitch, heightPerLayer);
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${settings.filename}.3mf`);
}

function generate3MFContent(image: PartListImage, pitch: number, heightPerLayer: number): string {
    let meshId = 1;
    let vertexOffset = 0;
    const meshes: string[] = [];
    const resources: string[] = [];
    
    // Generate a mesh for each color
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexIndex = 0;
        
        // For each pixel of this color, create a rectangular prism
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIndex) {
                    // Create 8 vertices for the rectangular prism
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = heightPerLayer;
                    
                    // 8 vertices of a cube
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
                    vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
                    
                    const v = localVertexIndex;
                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z0)
                    triangles.push(`<triangle v1="${v}" v2="${v+2}" v3="${v+1}"/>`);
                    triangles.push(`<triangle v1="${v}" v2="${v+3}" v3="${v+2}"/>`);
                    // Top face (z1)
                    triangles.push(`<triangle v1="${v+4}" v2="${v+5}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+4}" v2="${v+6}" v3="${v+7}"/>`);
                    // Front face (y0)
                    triangles.push(`<triangle v1="${v}" v2="${v+1}" v3="${v+5}"/>`);
                    triangles.push(`<triangle v1="${v}" v2="${v+5}" v3="${v+4}"/>`);
                    // Back face (y1)
                    triangles.push(`<triangle v1="${v+2}" v2="${v+3}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v+2}" v2="${v+7}" v3="${v+6}"/>`);
                    // Left face (x0)
                    triangles.push(`<triangle v1="${v}" v2="${v+4}" v3="${v+7}"/>`);
                    triangles.push(`<triangle v1="${v}" v2="${v+7}" v3="${v+3}"/>`);
                    // Right face (x1)
                    triangles.push(`<triangle v1="${v+1}" v2="${v+2}" v3="${v+6}"/>`);
                    triangles.push(`<triangle v1="${v+1}" v2="${v+6}" v3="${v+5}"/>`);
                    
                    localVertexIndex += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const meshXML = `    <object id="${meshId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n          ')}
        </vertices>
        <triangles>
${triangles.join('\n          ')}
        </triangles>
      </mesh>
    </object>`;
            
            resources.push(meshXML);
            meshes.push(`    <item objectid="${meshId}"/>`);
            meshId++;
            vertexOffset += localVertexIndex;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${resources.join('\n')}
  </resources>
  <build>
${meshes.join('\n')}
  </build>
</model>`;
}

/**
 * Generate OpenSCAD masks format - a zip with one image per color and an .scad file
 */
async function exportOpenSCADMasks(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    const pitch = getPitch(settings.materialSize);
    
    // Create one black/white image per color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const scadLayers: string[] = [];
    
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex];
        const imageData = ctx.createImageData(image.width, image.height);
        
        // Create black/white mask
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIndex;
                const value = isThisColor ? 255 : 0;
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const filename = `mask_${colorIndex}_${sanitizeFilename(color.target.name)}.png`;
        zip.file(filename, blob);
        
        // Add to OpenSCAD script
        const r = color.target.r / 255;
        const g = color.target.g / 255;
        const b = color.target.b / 255;
        scadLayers.push(`// ${color.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  translate([0, 0, ${colorIndex * 2}])
    surface(file = "${filename}", center = true, invert = true);`);
    }
    
    const scadContent = `// Generated by firaga.io
// OpenSCAD heightmap display

$fn = 30;
pixel_size = ${pitch};

scale([pixel_size, pixel_size, 2])
{
${scadLayers.join('\n\n')}
}
`;
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${settings.filename}.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Load JSZip library dynamically
 */
async function loadJSZip(): Promise<any> {
    // Check if already loaded
    if ((window as any).JSZip) {
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
