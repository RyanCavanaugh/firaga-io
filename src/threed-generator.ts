import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export type ThreeDFormat = "3mf" | "openscad";

export interface ThreeDSettings {
    format: ThreeDFormat;
    pixelHeight: number;
    pixelWidth: number;
    pixelDepth: number;
    filename: string;
}

export async function generate3D(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    if (settings.format === "3mf") {
        await generate3MF(image, settings);
    } else {
        await generateOpenSCADMasks(image, settings);
    }
}

async function generate3MF(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const { saveAs } = await import("file-saver");
    
    const xml = build3MFContent(image, settings);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    saveAs(blob, `${settings.filename}.3mf`);
}

function build3MFContent(image: PartListImage, settings: ThreeDSettings): string {
    const meshes: string[] = [];
    const resources: string[] = [];
    const components: string[] = [];
    let resourceId = 1;
    let objectId = 1;

    // Create material for each color
    const colorToMaterialId = new Map<number, number>();
    image.partList.forEach((part, idx) => {
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const materialId = resourceId++;
        colorToMaterialId.set(idx, materialId);
        
        resources.push(
            `    <basematerials id="${materialId}">`,
            `      <base name="${part.target.name}" displaycolor="#${hex.slice(1)}" />`,
            `    </basematerials>`
        );
    });

    // Create mesh for each color
    image.partList.forEach((part, colorIdx) => {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;

        // Build mesh for all pixels of this color
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    const baseIdx = vertexCount;
                    
                    // Create a box (8 vertices, 12 triangles)
                    const x0 = x * settings.pixelWidth;
                    const x1 = (x + 1) * settings.pixelWidth;
                    const y0 = y * settings.pixelHeight;
                    const y1 = (y + 1) * settings.pixelHeight;
                    const z0 = 0;
                    const z1 = settings.pixelDepth;

                    // 8 vertices of a box
                    vertices.push(
                        `        <vertex x="${x0}" y="${y0}" z="${z0}" />`,
                        `        <vertex x="${x1}" y="${y0}" z="${z0}" />`,
                        `        <vertex x="${x1}" y="${y1}" z="${z0}" />`,
                        `        <vertex x="${x0}" y="${y1}" z="${z0}" />`,
                        `        <vertex x="${x0}" y="${y0}" z="${z1}" />`,
                        `        <vertex x="${x1}" y="${y0}" z="${z1}" />`,
                        `        <vertex x="${x1}" y="${y1}" z="${z1}" />`,
                        `        <vertex x="${x0}" y="${y1}" z="${z1}" />`
                    );

                    // 12 triangles (2 per face, 6 faces)
                    // Bottom face (z=0)
                    triangles.push(`        <triangle v1="${baseIdx}" v2="${baseIdx + 2}" v3="${baseIdx + 1}" />`);
                    triangles.push(`        <triangle v1="${baseIdx}" v2="${baseIdx + 3}" v3="${baseIdx + 2}" />`);
                    // Top face (z=1)
                    triangles.push(`        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 5}" v3="${baseIdx + 6}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 4}" v2="${baseIdx + 6}" v3="${baseIdx + 7}" />`);
                    // Front face (y=0)
                    triangles.push(`        <triangle v1="${baseIdx}" v2="${baseIdx + 1}" v3="${baseIdx + 5}" />`);
                    triangles.push(`        <triangle v1="${baseIdx}" v2="${baseIdx + 5}" v3="${baseIdx + 4}" />`);
                    // Back face (y=1)
                    triangles.push(`        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 3}" v3="${baseIdx + 7}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 2}" v2="${baseIdx + 7}" v3="${baseIdx + 6}" />`);
                    // Left face (x=0)
                    triangles.push(`        <triangle v1="${baseIdx}" v2="${baseIdx + 4}" v3="${baseIdx + 7}" />`);
                    triangles.push(`        <triangle v1="${baseIdx}" v2="${baseIdx + 7}" v3="${baseIdx + 3}" />`);
                    // Right face (x=1)
                    triangles.push(`        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 2}" v3="${baseIdx + 6}" />`);
                    triangles.push(`        <triangle v1="${baseIdx + 1}" v2="${baseIdx + 6}" v3="${baseIdx + 5}" />`);

                    vertexCount += 8;
                }
            }
        }

        if (vertices.length > 0) {
            const meshObjectId = objectId++;
            const materialId = colorToMaterialId.get(colorIdx)!;
            
            meshes.push(
                `    <object id="${meshObjectId}" type="model">`,
                `      <mesh>`,
                `        <vertices>`,
                ...vertices,
                `        </vertices>`,
                `        <triangles>`,
                ...triangles,
                `        </triangles>`,
                `      </mesh>`,
                `    </object>`
            );
            
            components.push(`      <component objectid="${meshObjectId}" />`);
        }
    });

    // Build the final 3MF XML
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">',
        '  <resources>',
        ...resources,
        ...meshes,
        `    <object id="${objectId}" type="model">`,
        '      <components>',
        ...components,
        '      </components>',
        '    </object>',
        '  </resources>',
        '  <build>',
        `    <item objectid="${objectId}" />`,
        '  </build>',
        '</model>'
    ].join('\n');

    return xml;
}

async function generateOpenSCADMasks(image: PartListImage, settings: ThreeDSettings): Promise<void> {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");
    
    const zip = new JSZip();

    // Create a monochrome PNG for each color
    const maskPromises = image.partList.map(async (part, colorIdx) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelIndex = (y * image.width + x) * 4;
                const isThisColor = image.pixels[y][x] === colorIdx;
                const value = isThisColor ? 255 : 0;
                
                imageData.data[pixelIndex] = value;     // R
                imageData.data[pixelIndex + 1] = value; // G
                imageData.data[pixelIndex + 2] = value; // B
                imageData.data[pixelIndex + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return new Promise<{ filename: string; blob: Blob }>((resolve) => {
            canvas.toBlob((blob) => {
                const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
                resolve({
                    filename: `color_${colorIdx}_${sanitizedName}.png`,
                    blob: blob!
                });
            });
        });
    });

    const masks = await Promise.all(maskPromises);
    
    // Add all mask images to the zip
    masks.forEach(({ filename, blob }) => {
        zip.file(filename, blob);
    });

    // Generate OpenSCAD file
    const scadLines: string[] = [
        '// Generated by firaga.io',
        '// 3D pixel art representation',
        '',
        `pixel_width = ${settings.pixelWidth};`,
        `pixel_height = ${settings.pixelHeight};`,
        `pixel_depth = ${settings.pixelDepth};`,
        `image_width = ${image.width};`,
        `image_height = ${image.height};`,
        '',
        'union() {'
    ];

    masks.forEach(({ filename }, idx) => {
        const part = image.partList[idx];
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        scadLines.push(
            `  // ${part.target.name}`,
            `  color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])`,
            `  surface(file = "${filename}", center = false, invert = true);`,
            ''
        );
    });

    scadLines.push(
        '}',
        '',
        '// Scale and position the heightmap',
        'scale([pixel_width, pixel_height, pixel_depth])',
        'translate([0, 0, 0])',
        'children();'
    );

    zip.file(`${settings.filename}.scad`, scadLines.join('\n'));

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${settings.filename}_openscad.zip`);
}
