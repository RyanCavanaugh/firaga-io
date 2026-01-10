import { PartListImage } from "./image-utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    pitch: number;
    height: number;
    baseHeight: number;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings) {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCAD(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const pixelHeight = settings.height;
    const baseHeight = settings.baseHeight;

    let vertexId = 1;
    const objects: string[] = [];

    // Create base plate
    if (baseHeight > 0) {
        const baseObject = create3MFBox(
            0, 0, 0,
            width * pitch, height * pitch, baseHeight,
            vertexId
        );
        objects.push(baseObject.xml);
        vertexId = baseObject.nextId;
    }

    // Create colored pixel blocks
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const color = partList[colorIndex].target;
        const vertices: string[] = [];
        const triangles: string[] = [];
        let localVertexId = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    const box = createBox(
                        x * pitch,
                        y * pitch,
                        baseHeight,
                        pitch,
                        pitch,
                        pixelHeight,
                        localVertexId
                    );
                    vertices.push(...box.vertices);
                    triangles.push(...box.triangles);
                    localVertexId = box.nextLocalId;
                }
            }
        }

        if (vertices.length > 0) {
            const r = (color.r / 255).toFixed(6);
            const g = (color.g / 255).toFixed(6);
            const b = (color.b / 255).toFixed(6);
            
            objects.push(`    <object id="${vertexId}" type="model">
      <mesh>
        <vertices>
${vertices.join('\n')}
        </vertices>
        <triangles>
${triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`);
            
            objects.push(`    <object id="${vertexId + 1}" type="model">
      <components>
        <component objectid="${vertexId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
      </components>
    </object>`);
            
            vertexId += 2;
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
    <object id="${vertexId}" type="model">
      <components>
${objects.filter((_, i) => i % 2 === 1).map((_, i) => `        <component objectid="${(i + 1) * 2}" />`).join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${vertexId}" />
  </build>
</model>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function createBox(
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    startId: number
) {
    const vertices: string[] = [
        `          <vertex x="${x}" y="${y}" z="${z}" />`,
        `          <vertex x="${x + w}" y="${y}" z="${z}" />`,
        `          <vertex x="${x + w}" y="${y + h}" z="${z}" />`,
        `          <vertex x="${x}" y="${y + h}" z="${z}" />`,
        `          <vertex x="${x}" y="${y}" z="${z + d}" />`,
        `          <vertex x="${x + w}" y="${y}" z="${z + d}" />`,
        `          <vertex x="${x + w}" y="${y + h}" z="${z + d}" />`,
        `          <vertex x="${x}" y="${y + h}" z="${z + d}" />`
    ];

    const faces = [
        [0, 1, 2], [0, 2, 3], // bottom
        [4, 6, 5], [4, 7, 6], // top
        [0, 4, 5], [0, 5, 1], // front
        [1, 5, 6], [1, 6, 2], // right
        [2, 6, 7], [2, 7, 3], // back
        [3, 7, 4], [3, 4, 0]  // left
    ];

    const triangles = faces.map(([v1, v2, v3]) =>
        `          <triangle v1="${startId + v1}" v2="${startId + v2}" v3="${startId + v3}" />`
    );

    return {
        vertices,
        triangles,
        nextLocalId: startId + 8
    };
}

function create3MFBox(
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    objectId: number
) {
    const box = createBox(x, y, z, w, h, d, 0);
    const xml = `    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${box.vertices.join('\n')}
        </vertices>
        <triangles>
${box.triangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
    
    return { xml, nextId: objectId + 1 };
}

async function generateOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { width, height, partList, pixels } = image;
    const pitch = settings.pitch;
    const pixelHeight = settings.height;
    
    const zip = new JSZip();
    
    // Generate one black/white image per color
    const imagePromises = partList.map(async (part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw black pixels for this color
        ctx.fillStyle = 'black';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[y][x] === colorIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to blob
        return new Promise<{ name: string, blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({ name: `color_${colorIndex}_${colorName}.png`, blob: blob! });
            });
        });
    });
    
    const images = await Promise.all(imagePromises);
    
    // Add images to zip
    for (const img of images) {
        zip.file(img.name, img.blob);
    }
    
    // Generate OpenSCAD file
    let scadContent = `// Generated 3D pixel art
// Pitch: ${pitch}mm, Height: ${pixelHeight}mm

`;
    
    for (let i = 0; i < images.length; i++) {
        const part = partList[i];
        const colorName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const r = part.target.r / 255;
        const g = part.target.g / 255;
        const b = part.target.b / 255;
        
        scadContent += `
// ${part.target.name}
color([${r}, ${g}, ${b}]) {
    scale([${pitch}, ${pitch}, ${pixelHeight}]) {
        surface(file = "${images[i].name}", center = false, invert = true);
    }
}
`;
    }
    
    zip.file(`${settings.filename}.scad`, scadContent);
    
    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}
