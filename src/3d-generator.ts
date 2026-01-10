import { PartListImage } from './image-utils';
import { colorEntryToHex } from './utils';

declare const JSZip: any;

export function generate3MF(image: PartListImage, filename: string) {
    loadJSZip(() => {
        const { vertices, triangles, materials } = build3MFMesh(image);
        const xml = create3MFXml(vertices, triangles, materials);
        
        const zip = new JSZip();
        zip.file('[Content_Types].xml', createContentTypesXml());
        const relsFolder = zip.folder('_rels');
        relsFolder.file('.rels', createRelsXml());
        const modelFolder = zip.folder('3D');
        modelFolder.file('3dmodel.model', xml);
        
        zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
            downloadBlob(blob, filename.replace(/\.(png|jpg|jpeg)$/i, '') + '.3mf');
        });
    });
}

function build3MFMesh(image: PartListImage) {
    const vertices: number[][] = [];
    const triangles: { v1: number, v2: number, v3: number, pid: number }[] = [];
    const materials: { id: number, name: string, color: string }[] = [];
    
    // Create materials for each color
    image.partList.forEach((part, idx) => {
        materials.push({
            id: idx + 1,
            name: part.target.name,
            color: colorEntryToHex(part.target)
        });
    });
    
    const vertexMap = new Map<string, number>();
    
    function getOrAddVertex(x: number, y: number, z: number): number {
        const key = `${x},${y},${z}`;
        if (vertexMap.has(key)) {
            return vertexMap.get(key)!;
        }
        const idx = vertices.length;
        vertices.push([x, y, z]);
        vertexMap.set(key, idx);
        return idx;
    }
    
    // Build mesh: create a small box for each pixel
    const pixelSize = 1.0;
    const height = 1.0;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const colorIdx = image.pixels[y][x];
            if (colorIdx === -1) continue; // Skip transparent pixels
            
            const pid = colorIdx + 1; // Material ID (1-based)
            const x0 = x * pixelSize;
            const x1 = (x + 1) * pixelSize;
            const y0 = y * pixelSize;
            const y1 = (y + 1) * pixelSize;
            const z0 = 0;
            const z1 = height;
            
            // Create 8 vertices for the box
            const v000 = getOrAddVertex(x0, y0, z0);
            const v001 = getOrAddVertex(x0, y0, z1);
            const v010 = getOrAddVertex(x0, y1, z0);
            const v011 = getOrAddVertex(x0, y1, z1);
            const v100 = getOrAddVertex(x1, y0, z0);
            const v101 = getOrAddVertex(x1, y0, z1);
            const v110 = getOrAddVertex(x1, y1, z0);
            const v111 = getOrAddVertex(x1, y1, z1);
            
            // Create 12 triangles (2 per face, 6 faces)
            // Bottom face (z = 0)
            triangles.push({ v1: v000, v2: v100, v3: v110, pid });
            triangles.push({ v1: v000, v2: v110, v3: v010, pid });
            
            // Top face (z = height)
            triangles.push({ v1: v001, v2: v011, v3: v111, pid });
            triangles.push({ v1: v001, v2: v111, v3: v101, pid });
            
            // Front face (y = 0)
            triangles.push({ v1: v000, v2: v001, v3: v101, pid });
            triangles.push({ v1: v000, v2: v101, v3: v100, pid });
            
            // Back face (y = y1)
            triangles.push({ v1: v010, v2: v110, v3: v111, pid });
            triangles.push({ v1: v010, v2: v111, v3: v011, pid });
            
            // Left face (x = 0)
            triangles.push({ v1: v000, v2: v010, v3: v011, pid });
            triangles.push({ v1: v000, v2: v011, v3: v001, pid });
            
            // Right face (x = x1)
            triangles.push({ v1: v100, v2: v101, v3: v111, pid });
            triangles.push({ v1: v100, v2: v111, v3: v110, pid });
        }
    }
    
    return { vertices, triangles, materials };
}

function create3MFXml(vertices: number[][], triangles: { v1: number, v2: number, v3: number, pid: number }[], materials: { id: number, name: string, color: string }[]) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
    xml += '  <resources>\n';
    
    // Add base materials
    xml += '    <basematerials id="1">\n';
    materials.forEach(mat => {
        const color = mat.color.replace('#', '');
        xml += `      <base name="${escapeXml(mat.name)}" displaycolor="#${color}FF" />\n`;
    });
    xml += '    </basematerials>\n';
    
    // Add mesh object
    xml += '    <object id="2" type="model">\n';
    xml += '      <mesh>\n';
    xml += '        <vertices>\n';
    vertices.forEach(v => {
        xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
    });
    xml += '        </vertices>\n';
    xml += '        <triangles>\n';
    triangles.forEach(t => {
        xml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" pid="1" p1="${t.pid - 1}" />\n`;
    });
    xml += '        </triangles>\n';
    xml += '      </mesh>\n';
    xml += '    </object>\n';
    xml += '  </resources>\n';
    xml += '  <build>\n';
    xml += '    <item objectid="2" />\n';
    xml += '  </build>\n';
    xml += '</model>\n';
    
    return xml;
}

function createContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
}

function createRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`;
}

function escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export function generateOpenSCADMasks(image: PartListImage, filename: string) {
    loadJSZip(() => {
        const zip = new JSZip();
        const imageFolder = zip.folder('images');
        
        // Generate one black/white image per color
        const scadLines: string[] = [
            '// Generated by firaga.io',
            '// OpenSCAD heightmap visualization',
            '',
            'pixel_size = 1;',
            'height = 1;',
            ''
        ];
        
        const promises: Promise<void>[] = [];
        
        image.partList.forEach((part, idx) => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d')!;
            
            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, image.width, image.height);
            
            // Draw black pixels for this color
            ctx.fillStyle = 'black';
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[y][x] === idx) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            
            // Convert to PNG blob
            const promise = new Promise<void>((resolve) => {
                canvas.toBlob(blob => {
                    if (blob) {
                        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                        const imageName = `color_${idx}_${colorName}.png`;
                        imageFolder.file(imageName, blob);
                    }
                    resolve();
                }, 'image/png');
            });
            promises.push(promise);
            
            // Add to OpenSCAD file
            const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
            const colorHex = colorEntryToHex(part.target);
            scadLines.push(`// ${part.target.name}`);
            scadLines.push(`color("${colorHex}")`);
            scadLines.push(`  surface(file = "images/color_${idx}_${colorName}.png", center = true, invert = true);`);
            scadLines.push('');
        });
        
        const scadContent = scadLines.join('\n');
        zip.file('model.scad', scadContent);
        
        // Wait for all blobs to be ready
        Promise.all(promises).then(() => {
            zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
                downloadBlob(blob, filename.replace(/\.(png|jpg|jpeg)$/i, '') + '_openscad.zip');
            });
        });
    });
}

function loadJSZip(callback: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = () => {
            callback();
        };
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        callback();
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
