import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PartListImage } from './image-utils';

/**
 * Export image as 3MF (3D Manufacturing Format) file
 * Creates a triangle mesh with separate material shapes for each color
 */
export async function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MFContent(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    saveAs(blob, `${filename}.3mf`);
}

/**
 * Generate 3MF XML content for the image
 */
function generate3MFContent(image: PartListImage): string {
    const pixelHeight = 1.0; // Height of each pixel in mm
    const pixelWidth = 2.5;  // Width of each pixel in mm
    const baseHeight = 0.5;  // Base thickness in mm
    
    let vertices = '';
    let triangles = '';
    let vertexIndex = 0;
    const materialMap = new Map<number, number>();
    
    // Build material map
    for (let i = 0; i < image.partList.length; i++) {
        materialMap.set(i, i);
    }
    
    // Generate meshes for each color
    const objects: string[] = [];
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorEntry = image.partList[colorIdx];
        vertices = '';
        triangles = '';
        vertexIndex = 0;
        
        // Generate vertices and triangles for pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const cubeVertices = generateCubeVertices(
                        x * pixelWidth, 
                        y * pixelWidth, 
                        0, 
                        pixelWidth, 
                        pixelWidth, 
                        pixelHeight
                    );
                    vertices += cubeVertices.vertices;
                    triangles += generateCubeTriangles(vertexIndex, colorIdx);
                    vertexIndex += 8;
                }
            }
        }
        
        if (vertexIndex > 0) {
            objects.push(`
    <object id="${colorIdx + 1}" type="model">
      <mesh>
        <vertices>
${vertices}
        </vertices>
        <triangles>
${triangles}
        </triangles>
      </mesh>
    </object>`);
        }
    }
    
    // Build materials section
    const materials = image.partList.map((entry, idx) => {
        const r = entry.target.r;
        const g = entry.target.g;
        const b = entry.target.b;
        const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        return `    <base name="${entry.target.name}" displaycolor="${color}" />`;
    }).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="0">
${materials}
    </basematerials>
${objects.join('\n')}
    <build>
${objects.map((_, idx) => `      <item objectid="${idx + 1}" />`).join('\n')}
    </build>
  </resources>
</model>`;
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}

function generateCubeVertices(x: number, y: number, z: number, w: number, h: number, d: number): { vertices: string } {
    const verts = [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + h, z],
        [x, y + h, z],
        [x, y, z + d],
        [x + w, y, z + d],
        [x + w, y + h, z + d],
        [x, y + h, z + d],
    ];
    
    const vertices = verts.map(v => 
        `          <vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}" />`
    ).join('\n');
    
    return { vertices };
}

function generateCubeTriangles(startIdx: number, materialId: number): string {
    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0], // left
    ];
    
    return faces.map(face => 
        `          <triangle v1="${startIdx + face[0]}" v2="${startIdx + face[1]}" v3="${startIdx + face[2]}" pid="0" p1="${materialId}" />`
    ).join('\n');
}

/**
 * Export image as OpenSCAD masks (ZIP file with images and .scad file)
 */
export async function exportOpenSCADMasks(image: PartListImage, filename: string) {
    const files = generateOpenSCADFiles(image);
    const zip = new JSZip();
    
    // Add all files to the ZIP
    for (const file of files) {
        if (file.content instanceof Blob) {
            zip.file(file.name, file.content);
        } else {
            zip.file(file.name, file.content);
        }
    }
    
    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${filename}_openscad.zip`);
}

/**
 * Generate OpenSCAD mask files
 */
function generateOpenSCADFiles(image: PartListImage): Array<{ name: string, content: Blob | string }> {
    const files: Array<{ name: string, content: Blob | string }> = [];
    
    // Generate one monochrome image per color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorEntry = image.partList[colorIdx];
        const imageData = generateMonochromeImage(image, colorIdx);
        const blob = dataURLToBlob(imageData);
        const safeName = sanitizeFilename(colorEntry.target.name);
        files.push({
            name: `mask_${colorIdx}_${safeName}.png`,
            content: blob
        });
    }
    
    // Generate OpenSCAD file
    const scadContent = generateOpenSCADFile(image);
    files.push({
        name: 'display.scad',
        content: scadContent
    });
    
    return files;
}

/**
 * Generate a monochrome (black/white) image for a specific color
 */
function generateMonochromeImage(image: PartListImage, colorIdx: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(image.width, image.height);
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const idx = (y * image.width + x) * 4;
            const isColor = image.pixels[y][x] === colorIdx;
            const value = isColor ? 255 : 0;
            
            imageData.data[idx] = value;     // R
            imageData.data[idx + 1] = value; // G
            imageData.data[idx + 2] = value; // B
            imageData.data[idx + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

/**
 * Generate OpenSCAD file that loads and combines all masks
 */
function generateOpenSCADFile(image: PartListImage): string {
    const pixelSize = 2.5; // Size of each pixel in mm
    const heightPerLayer = 1.0; // Height for each color layer in mm
    
    let scadCode = `// OpenSCAD file for 3D display
// Generated for image: ${image.width}x${image.height}

pixel_size = ${pixelSize};
height_per_layer = ${heightPerLayer};
image_width = ${image.width};
image_height = ${image.height};

`;
    
    // Generate modules for each color layer
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorEntry = image.partList[colorIdx];
        const safeName = sanitizeFilename(colorEntry.target.name);
        const r = colorEntry.target.r / 255;
        const g = colorEntry.target.g / 255;
        const b = colorEntry.target.b / 255;
        
        scadCode += `
// Layer for ${colorEntry.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${colorIdx * heightPerLayer}])
scale([pixel_size, pixel_size, height_per_layer])
surface(file = "mask_${colorIdx}_${safeName}.png", center = true, invert = true);

`;
    }
    
    return scadCode;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}
