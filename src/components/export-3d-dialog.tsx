import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { colorEntryToHex } from '../utils';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} />
                        <div class="option">
                            <h3>3MF Mesh</h3>
                            <span class="format-icon">📐</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? "3MF triangle mesh with separate material shapes for each color"
                        : "Zip file with monochrome masks per color and OpenSCAD file"}
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export</button>
        </div>
    </div>;

    function exportFile() {
        window.clarity?.("event", "3d-export");
        if (format === '3mf') {
            export3MF(props.image, props.filename);
        } else {
            exportOpenSCAD(props.image, props.filename);
        }
    }
}

function export3MF(image: PartListImage, filename: string) {
    const xml = generate3MF(image);
    const blob = new Blob([xml], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    downloadFile(blob, filename.replace('.png', '') + '.3mf');
}

function generate3MF(image: PartListImage): string {
    const voxelSize = 1.0;
    const height = 0.5;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    xml += '    <basematerials id="1">\n';
    
    // Add materials for each color
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const hex = colorEntryToHex(color).substring(1); // Remove #
        xml += `      <base name="${color.name}" displaycolor="#${hex}" />\n`;
    }
    
    xml += '    </basematerials>\n';
    
    // Generate meshes for each color
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        xml += generateMeshForColor(image, colorIdx, voxelSize, height);
    }
    
    xml += '  </resources>\n';
    xml += '  <build>\n';
    
    // Add all meshes to the build
    for (let i = 0; i < image.partList.length; i++) {
        xml += `    <item objectid="${i + 2}" />\n`;
    }
    
    xml += '  </build>\n';
    xml += '</model>';
    
    return xml;
}

function generateMeshForColor(image: PartListImage, colorIdx: number, voxelSize: number, height: number): string {
    const vertices: string[] = [];
    const triangles: string[] = [];
    let vertexCount = 0;
    
    // Create voxels for each pixel of this color
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                // Create a box at this position
                const x0 = x * voxelSize;
                const y0 = y * voxelSize;
                const x1 = (x + 1) * voxelSize;
                const y1 = (y + 1) * voxelSize;
                const z0 = 0;
                const z1 = height;
                
                // 8 vertices of the box
                const v = vertexCount;
                vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z0}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y0}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y0}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x1}" y="${y1}" z="${z1}" />`);
                vertices.push(`      <vertex x="${x0}" y="${y1}" z="${z1}" />`);
                
                // 12 triangles (2 per face, 6 faces)
                // Bottom face
                triangles.push(`      <triangle v1="${v}" v2="${v+2}" v3="${v+1}" />`);
                triangles.push(`      <triangle v1="${v}" v2="${v+3}" v3="${v+2}" />`);
                // Top face
                triangles.push(`      <triangle v1="${v+4}" v2="${v+5}" v3="${v+6}" />`);
                triangles.push(`      <triangle v1="${v+4}" v2="${v+6}" v3="${v+7}" />`);
                // Front face
                triangles.push(`      <triangle v1="${v}" v2="${v+1}" v3="${v+5}" />`);
                triangles.push(`      <triangle v1="${v}" v2="${v+5}" v3="${v+4}" />`);
                // Back face
                triangles.push(`      <triangle v1="${v+3}" v2="${v+7}" v3="${v+6}" />`);
                triangles.push(`      <triangle v1="${v+3}" v2="${v+6}" v3="${v+2}" />`);
                // Left face
                triangles.push(`      <triangle v1="${v}" v2="${v+4}" v3="${v+7}" />`);
                triangles.push(`      <triangle v1="${v}" v2="${v+7}" v3="${v+3}" />`);
                // Right face
                triangles.push(`      <triangle v1="${v+1}" v2="${v+2}" v3="${v+6}" />`);
                triangles.push(`      <triangle v1="${v+1}" v2="${v+6}" v3="${v+5}" />`);
                
                vertexCount += 8;
            }
        }
    }
    
    if (vertices.length === 0) {
        return '';
    }
    
    let xml = `    <object id="${colorIdx + 2}" type="model" materialid="1" name="${image.partList[colorIdx].target.name}">\n`;
    xml += '      <mesh>\n';
    xml += '        <vertices>\n';
    xml += vertices.join('\n') + '\n';
    xml += '        </vertices>\n';
    xml += '        <triangles>\n';
    xml += triangles.join('\n') + '\n';
    xml += '        </triangles>\n';
    xml += '      </mesh>\n';
    xml += '    </object>\n';
    
    return xml;
}

async function exportOpenSCAD(image: PartListImage, filename: string) {
    // We need JSZip for this
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Create a monochrome image for each color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    let scadCode = '// OpenSCAD heightmap display\n';
    scadCode += `// Generated from ${filename}\n\n`;
    scadCode += 'scale_factor = 1;\n';
    scadCode += 'height_scale = 0.5;\n\n';
    
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx].target;
        
        // Create black and white image
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const i = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                const val = isThisColor ? 255 : 0;
                imageData.data[i] = val;
                imageData.data[i + 1] = val;
                imageData.data[i + 2] = val;
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to PNG and add to zip
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeColorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const maskFilename = `mask_${colorIdx}_${safeColorName}.png`;
        zip.file(maskFilename, blob);
        
        // Add to SCAD code
        const hex = colorEntryToHex(color);
        scadCode += `// ${color.name}\n`;
        scadCode += `color("${hex}")\n`;
        scadCode += `translate([0, 0, ${colorIdx * 0.1}])\n`;
        scadCode += `scale([scale_factor, scale_factor, height_scale])\n`;
        scadCode += `surface(file = "${maskFilename}", center = true, invert = false);\n\n`;
    }
    
    zip.file('display.scad', scadCode);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, filename.replace('.png', '') + '_openscad.zip');
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
