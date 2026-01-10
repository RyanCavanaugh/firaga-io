import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDSettings = {
    format: "3mf" | "openscad-masks";
    filename: string;
    pitch: number;
    height: number;
};

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const rels = 
`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`;
    
    const contentTypes = 
`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const objects: string[] = [];
    let objectId = 1;

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const color = part.target;
        const hex = colorEntryToHex(color).slice(1);
        
        const vertices: string[] = [];
        const triangles: string[] = [];
        const vertexMap = new Map<string, number>();
        let vertexId = 0;

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const x0 = x * settings.pitch;
                    const y0 = y * settings.pitch;
                    const x1 = (x + 1) * settings.pitch;
                    const y1 = (y + 1) * settings.pitch;
                    const z0 = 0;
                    const z1 = settings.height;

                    const boxVerts = [
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
                    ];

                    const indices: number[] = [];
                    for (const vert of boxVerts) {
                        const key = `${vert[0]},${vert[1]},${vert[2]}`;
                        let idx = vertexMap.get(key);
                        if (idx === undefined) {
                            idx = vertexId++;
                            vertexMap.set(key, idx);
                            vertices.push(`      <vertex x="${vert[0]}" y="${vert[1]}" z="${vert[2]}"/>`);
                        }
                        indices.push(idx);
                    }

                    const faces = [
                        [indices[0], indices[2], indices[1]], [indices[0], indices[3], indices[2]],
                        [indices[4], indices[5], indices[6]], [indices[4], indices[6], indices[7]],
                        [indices[0], indices[1], indices[5]], [indices[0], indices[5], indices[4]],
                        [indices[1], indices[2], indices[6]], [indices[1], indices[6], indices[5]],
                        [indices[2], indices[3], indices[7]], [indices[2], indices[7], indices[6]],
                        [indices[3], indices[0], indices[4]], [indices[3], indices[4], indices[7]]
                    ];

                    for (const face of faces) {
                        triangles.push(`      <triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}"/>`);
                    }
                }
            }
        }

        if (vertices.length > 0) {
            objects.push(
                `  <object id="${objectId}" type="model">\n` +
                `    <mesh>\n` +
                `      <vertices>\n` +
                vertices.join('\n') + '\n' +
                `      </vertices>\n` +
                `      <triangles>\n` +
                triangles.join('\n') + '\n' +
                `      </triangles>\n` +
                `    </mesh>\n` +
                `  </object>`
            );
            objectId++;
        }
    }

    const buildItems = objects.map((_, idx) => 
        `    <item objectid="${idx + 1}"/>`
    ).join('\n');

    const model = 
`<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${buildItems}
  </build>
</model>`;

    zip.file('[Content_Types].xml', contentTypes);
    zip.folder('_rels')?.file('.rels', rels);
    zip.folder('3D')?.file('3dmodel.model', model);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${settings.filename}.3mf`);
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const scadLines: string[] = [
        '// Generated by firaga.io',
        '// This file creates a 3D representation of the image using heightmaps',
        '',
        `pitch = ${settings.pitch};`,
        `height = ${settings.height};`,
        ''
    ];

    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const part = image.partList[colorIdx];
        const color = part.target;
        const filename = `color_${colorIdx}_${sanitizeFilename(color.name)}.png`;

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isColor = image.pixels[y][x] === colorIdx;
                const val = isColor ? 255 : 0;
                imageData.data[idx] = val;
                imageData.data[idx + 1] = val;
                imageData.data[idx + 2] = val;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const pngData = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        if (pngData) {
            zip.file(filename, pngData);
            
            const hexColor = colorEntryToHex(color).slice(1);
            const r = parseInt(hexColor.substr(0, 2), 16) / 255;
            const g = parseInt(hexColor.substr(2, 2), 16) / 255;
            const b = parseInt(hexColor.substr(4, 2), 16) / 255;
            
            scadLines.push(
                `// ${color.name}`,
                `color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`,
                `  scale([pitch, pitch, height])`,
                `    surface(file="${filename}", center=true, invert=true);`,
                ''
            );
        }
    }

    zip.file('model.scad', scadLines.join('\n'));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${settings.filename}_openscad.zip`);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
