import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type Export3DSettings = {
    format: "3mf" | "openscad";
    baseHeight: number;
    pixelHeight: number;
    filename: string;
};

export async function export3D(image: PartListImage, settings: Export3DSettings): Promise<void> {
    if (settings.format === "3mf") {
        await export3MF(image, settings);
    } else {
        await exportOpenSCAD(image, settings);
    }
}

async function export3MF(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { width, height, partList, pixels } = image;
    const { baseHeight, pixelHeight } = settings;
    
    const materials: string[] = [];
    const materialMap = new Map<number, number>();
    
    partList.forEach((entry, idx) => {
        materialMap.set(idx, materials.length);
        const hex = colorEntryToHex(entry.target);
        materials.push(`    <basematerials:base name="${escapeXml(entry.target.name)}" displaycolor="${hex}" />`);
    });
    
    const objectsXml: string[] = [];
    
    partList.forEach((entry, partIdx) => {
        const matId = materialMap.get(partIdx)!;
        const colorVertices: string[] = [];
        const colorTriangles: string[] = [];
        let colorVertexIndex = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === partIdx) {
                    const x0 = x;
                    const x1 = x + 1;
                    const y0 = y;
                    const y1 = y + 1;
                    const z0 = 0;
                    const z1 = baseHeight + pixelHeight;
                    
                    const v0 = colorVertexIndex++;
                    const v1 = colorVertexIndex++;
                    const v2 = colorVertexIndex++;
                    const v3 = colorVertexIndex++;
                    const v4 = colorVertexIndex++;
                    const v5 = colorVertexIndex++;
                    const v6 = colorVertexIndex++;
                    const v7 = colorVertexIndex++;
                    
                    colorVertices.push(
                        `      <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `      <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `      <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `      <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );
                    
                    colorTriangles.push(
                        `      <triangle v1="${v0}" v2="${v1}" v3="${v2}" />`,
                        `      <triangle v1="${v0}" v2="${v2}" v3="${v3}" />`,
                        `      <triangle v1="${v4}" v2="${v6}" v3="${v5}" />`,
                        `      <triangle v1="${v4}" v2="${v7}" v3="${v6}" />`,
                        `      <triangle v1="${v0}" v2="${v4}" v3="${v5}" />`,
                        `      <triangle v1="${v0}" v2="${v5}" v3="${v1}" />`,
                        `      <triangle v1="${v1}" v2="${v5}" v3="${v6}" />`,
                        `      <triangle v1="${v1}" v2="${v6}" v3="${v2}" />`,
                        `      <triangle v1="${v2}" v2="${v6}" v3="${v7}" />`,
                        `      <triangle v1="${v2}" v2="${v7}" v3="${v3}" />`,
                        `      <triangle v1="${v3}" v2="${v7}" v3="${v4}" />`,
                        `      <triangle v1="${v3}" v2="${v4}" v3="${v0}" />`
                    );
                }
            }
        }
        
        if (colorVertices.length > 0) {
            const objId = objectsXml.length + 2;
            objectsXml.push(`  <object id="${objId}" type="model" pid="1" pindex="${matId}">
    <mesh>
      <vertices>
${colorVertices.join('\n')}
      </vertices>
      <triangles>
${colorTriangles.join('\n')}
      </triangles>
    </mesh>
  </object>`);
        }
    });
    
    const componentsXml = objectsXml.map((_, idx) => 
        `      <component objectid="${idx + 2}" />`
    ).join('\n');
    
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:basematerials="http://schemas.microsoft.com/3dmanufacturing/basematerials/2015/02">
  <resources>
    <basematerials:basematerials id="1">
${materials.join('\n')}
    </basematerials:basematerials>
${objectsXml.join('\n')}
    <object id="1" type="model">
      <components>
${componentsXml}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;
    
    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;
    
    zip.file('3D/3dmodel.model', modelXml);
    zip.file('_rels/.rels', relsXml);
    zip.file('[Content_Types].xml', contentTypesXml);
    
    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(content, `${settings.filename}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

async function exportOpenSCAD(image: PartListImage, settings: Export3DSettings): Promise<void> {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    const { width, height, partList, pixels } = image;
    const { baseHeight, pixelHeight } = settings;
    
    const scadLines: string[] = [
        '// Generated by firaga.io',
        `// Image size: ${width}x${height}`,
        '',
        `base_height = ${baseHeight};`,
        `pixel_height = ${pixelHeight};`,
        '',
        'union() {'
    ];
    
    for (let partIdx = 0; partIdx < partList.length; partIdx++) {
        const entry = partList[partIdx];
        const filename = `color_${partIdx}_${sanitizeFilename(entry.target.name)}.png`;
        
        const imageData = createMaskImage(image, partIdx);
        const blob = await imageToPngBlob(imageData);
        zip.file(filename, blob);
        
        const hex = colorEntryToHex(entry.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        scadLines.push(`    color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`);
        scadLines.push(`        surface(file="${filename}", center=true, invert=true)`);
        scadLines.push(`            scale([1, 1, pixel_height]);`);
    }
    
    scadLines.push('}');
    scadLines.push('');
    scadLines.push(`// Base plate`);
    scadLines.push(`translate([0, 0, -base_height/2])`);
    scadLines.push(`    cube([${width}, ${height}, base_height], center=true);`);
    
    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));
    
    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(content, `${settings.filename}.zip`, 'application/zip');
}

function createMaskImage(image: PartListImage, partIdx: number): ImageData {
    const { width, height, pixels } = image;
    const imageData = new ImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isMatch = pixels[y][x] === partIdx;
            const value = isMatch ? 0 : 255;
            
            imageData.data[idx] = value;
            imageData.data[idx + 1] = value;
            imageData.data[idx + 2] = value;
            imageData.data[idx + 3] = 255;
        }
    }
    
    return imageData;
}

async function imageToPngBlob(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/png');
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = typeof content === 'string' 
        ? new Blob([content], { type: mimeType })
        : content;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

let jsZipPromise: Promise<typeof import('jszip')> | undefined;

async function loadJSZip(): Promise<typeof import('jszip')> {
    if (jsZipPromise) {
        return jsZipPromise;
    }
    
    jsZipPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => {
            resolve((window as any).JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
    
    return jsZipPromise;
}
