import { PartListImage } from "./image-utils";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    filename: string;
    pitch: number;
    height: number;
}

export function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        generate3MF(image, settings);
    } else {
        generateOpenSCAD(image, settings);
    }
}

function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height } = image;
    const pitch = settings.pitch;
    const voxelHeight = settings.height;

    // Build 3MF XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <basematerials id="1">
`;

    // Add materials (colors)
    image.partList.forEach((part, idx) => {
        const color = part.target;
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        xml += `      <base name="${escapeXml(color.name)}" displaycolor="#${r}${g}${b}" />\n`;
    });

    xml += `    </basematerials>
`;

    // Create mesh objects for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: Array<[number, number, number]> = [];
        const triangles: Array<[number, number, number]> = [];

        // Find all pixels of this color and create boxes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertices.length;
                    const x0 = x * pitch;
                    const x1 = (x + 1) * pitch;
                    const y0 = y * pitch;
                    const y1 = (y + 1) * pitch;
                    const z0 = 0;
                    const z1 = voxelHeight;

                    // 8 vertices of a box
                    vertices.push(
                        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // bottom
                        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // top
                    );

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face
                    triangles.push([baseIdx + 0, baseIdx + 2, baseIdx + 1]);
                    triangles.push([baseIdx + 0, baseIdx + 3, baseIdx + 2]);
                    // Top face
                    triangles.push([baseIdx + 4, baseIdx + 5, baseIdx + 6]);
                    triangles.push([baseIdx + 4, baseIdx + 6, baseIdx + 7]);
                    // Front face
                    triangles.push([baseIdx + 0, baseIdx + 1, baseIdx + 5]);
                    triangles.push([baseIdx + 0, baseIdx + 5, baseIdx + 4]);
                    // Back face
                    triangles.push([baseIdx + 2, baseIdx + 3, baseIdx + 7]);
                    triangles.push([baseIdx + 2, baseIdx + 7, baseIdx + 6]);
                    // Left face
                    triangles.push([baseIdx + 3, baseIdx + 0, baseIdx + 4]);
                    triangles.push([baseIdx + 3, baseIdx + 4, baseIdx + 7]);
                    // Right face
                    triangles.push([baseIdx + 1, baseIdx + 2, baseIdx + 6]);
                    triangles.push([baseIdx + 1, baseIdx + 6, baseIdx + 5]);
                }
            }
        }

        if (vertices.length > 0) {
            const objectId = colorIdx + 2;
            xml += `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
`;
            vertices.forEach(v => {
                xml += `          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />\n`;
            });

            xml += `        </vertices>
        <triangles>
`;
            triangles.forEach(t => {
                xml += `          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" pid="1" p1="${colorIdx}" />\n`;
            });

            xml += `        </triangles>
      </mesh>
    </object>
`;
        }
    });

    xml += `  </resources>
  <build>
`;

    // Add all objects to the build
    image.partList.forEach((part, colorIdx) => {
        const objectId = colorIdx + 2;
        xml += `    <item objectid="${objectId}" />\n`;
    });

    xml += `  </build>
</model>`;

    // Create blob and download
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    downloadBlob(blob, `${settings.filename}.3mf`);
}

function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
        loadJSZipAndRetry(() => generateOpenSCAD(image, settings));
        return;
    }

    const zip = new JSZip();
    const { width, height } = image;

    // Create a monochrome image for each color
    image.partList.forEach((part, colorIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Mark pixels of this color as black
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to data URL and add to zip
        canvas.toBlob(blob => {
            if (blob) {
                const filename = `color_${colorIdx}_${sanitizeFilename(part.target.name)}.png`;
                zip.file(filename, blob);
            }
        });
    });

    // Create OpenSCAD file
    let scadContent = `// Generated by firaga.io
// 3D heightmap visualization

`;

    image.partList.forEach((part, colorIdx) => {
        const color = part.target;
        const filename = `color_${colorIdx}_${sanitizeFilename(color.name)}.png`;
        scadContent += `// ${color.name}
color([${color.r / 255}, ${color.g / 255}, ${color.b / 255}])
  scale([${settings.pitch}, ${settings.pitch}, ${settings.height}])
    surface(file = "${filename}", center = true, invert = true);

`;
    });

    zip.file(`${settings.filename}.scad`, scadContent);

    // Generate and download zip file
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        downloadBlob(blob, `${settings.filename}_openscad.zip`);
    });
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

function loadJSZipAndRetry(callback: () => void) {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        const tag = document.createElement("script");
        tag.id = tagName;
        tag.onload = callback;
        tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(tag);
    } else {
        callback();
    }
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
