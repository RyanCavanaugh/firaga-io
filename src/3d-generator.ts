import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export interface ThreeDSettings {
    format: "3mf" | "openscad";
    heightPerLayer: number;
    baseHeight: number;
    pixelSize: number;
}

export async function make3D(image: PartListImage, settings: ThreeDSettings) {
    await load3DLibraries();
    
    if (settings.format === "3mf") {
        make3MF(image, settings);
    } else {
        makeOpenSCAD(image, settings);
    }
}

async function load3DLibraries() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => {
                resolve();
            };
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}

function make3MF(image: PartListImage, settings: ThreeDSettings) {
    const { pixelSize, heightPerLayer, baseHeight } = settings;
    
    // Generate 3MF XML content
    let meshId = 1;
    const objects: string[] = [];
    const resources: string[] = [];
    
    // Add base layer
    const baseVertices: string[] = [];
    const baseTriangles: string[] = [];
    
    // Create base mesh
    const baseWidth = image.width * pixelSize;
    const baseDepth = image.height * pixelSize;
    
    baseVertices.push(
        `<vertex x="0" y="0" z="0" />`,
        `<vertex x="${baseWidth}" y="0" z="0" />`,
        `<vertex x="${baseWidth}" y="${baseDepth}" z="0" />`,
        `<vertex x="0" y="${baseDepth}" z="0" />`,
        `<vertex x="0" y="0" z="${baseHeight}" />`,
        `<vertex x="${baseWidth}" y="0" z="${baseHeight}" />`,
        `<vertex x="${baseWidth}" y="${baseDepth}" z="${baseHeight}" />`,
        `<vertex x="0" y="${baseDepth}" z="${baseHeight}" />`
    );
    
    // Base triangles (12 triangles for a box)
    baseTriangles.push(
        // Bottom
        `<triangle v1="0" v2="2" v3="1" />`,
        `<triangle v1="0" v2="3" v3="2" />`,
        // Top
        `<triangle v1="4" v2="5" v3="6" />`,
        `<triangle v1="4" v2="6" v3="7" />`,
        // Front
        `<triangle v1="0" v2="1" v3="5" />`,
        `<triangle v1="0" v2="5" v3="4" />`,
        // Back
        `<triangle v1="2" v2="3" v3="7" />`,
        `<triangle v1="2" v2="7" v3="6" />`,
        // Left
        `<triangle v1="0" v2="4" v3="7" />`,
        `<triangle v1="0" v2="7" v3="3" />`,
        // Right
        `<triangle v1="1" v2="2" v3="6" />`,
        `<triangle v1="1" v2="6" v3="5" />`
    );
    
    resources.push(
        `<object id="${meshId}" type="model">`,
        `<mesh>`,
        `<vertices>`,
        ...baseVertices,
        `</vertices>`,
        `<triangles>`,
        ...baseTriangles,
        `</triangles>`,
        `</mesh>`,
        `</object>`
    );
    
    objects.push(`<item objectid="${meshId}" />`);
    meshId++;
    
    // Add colored pixels
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const vertices: string[] = [];
        const triangles: string[] = [];
        let vertexCount = 0;
        
        const z = baseHeight + partIndex * heightPerLayer;
        const zTop = z + heightPerLayer;
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    const x0 = x * pixelSize;
                    const y0 = y * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    
                    const vOffset = vertexCount;
                    vertices.push(
                        `<vertex x="${x0}" y="${y0}" z="${z}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${z}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${z}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${z}" />`,
                        `<vertex x="${x0}" y="${y0}" z="${zTop}" />`,
                        `<vertex x="${x1}" y="${y0}" z="${zTop}" />`,
                        `<vertex x="${x1}" y="${y1}" z="${zTop}" />`,
                        `<vertex x="${x0}" y="${y1}" z="${zTop}" />`
                    );
                    
                    triangles.push(
                        // Bottom
                        `<triangle v1="${vOffset + 0}" v2="${vOffset + 2}" v3="${vOffset + 1}" />`,
                        `<triangle v1="${vOffset + 0}" v2="${vOffset + 3}" v3="${vOffset + 2}" />`,
                        // Top
                        `<triangle v1="${vOffset + 4}" v2="${vOffset + 5}" v3="${vOffset + 6}" />`,
                        `<triangle v1="${vOffset + 4}" v2="${vOffset + 6}" v3="${vOffset + 7}" />`,
                        // Front
                        `<triangle v1="${vOffset + 0}" v2="${vOffset + 1}" v3="${vOffset + 5}" />`,
                        `<triangle v1="${vOffset + 0}" v2="${vOffset + 5}" v3="${vOffset + 4}" />`,
                        // Back
                        `<triangle v1="${vOffset + 2}" v2="${vOffset + 3}" v3="${vOffset + 7}" />`,
                        `<triangle v1="${vOffset + 2}" v2="${vOffset + 7}" v3="${vOffset + 6}" />`,
                        // Left
                        `<triangle v1="${vOffset + 0}" v2="${vOffset + 4}" v3="${vOffset + 7}" />`,
                        `<triangle v1="${vOffset + 0}" v2="${vOffset + 7}" v3="${vOffset + 3}" />`,
                        // Right
                        `<triangle v1="${vOffset + 1}" v2="${vOffset + 2}" v3="${vOffset + 6}" />`,
                        `<triangle v1="${vOffset + 1}" v2="${vOffset + 6}" v3="${vOffset + 5}" />`
                    );
                    
                    vertexCount += 8;
                }
            }
        }
        
        if (vertices.length > 0) {
            const color = image.partList[partIndex].target;
            const colorHex = colorEntryToHex(color).substring(1); // Remove #
            
            resources.push(
                `<basematerials id="${meshId + 1000}">`,
                `<base name="${color.name}" displaycolor="#${colorHex}" />`,
                `</basematerials>`,
                `<object id="${meshId}" type="model">`,
                `<mesh>`,
                `<vertices>`,
                ...vertices,
                `</vertices>`,
                `<triangles>`,
                ...triangles,
                `</triangles>`,
                `</mesh>`,
                `</object>`
            );
            
            objects.push(`<item objectid="${meshId}" />`);
            meshId++;
        }
    }
    
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    ${resources.join('\n    ')}
  </resources>
  <build>
    ${objects.join('\n    ')}
  </build>
</model>`;
    
    // Create 3MF package (zip with .3mf extension)
    const zip = new JSZip();
    zip.file("3D/3dmodel.model", content);
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);
    
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "model.3mf";
        a.click();
        URL.revokeObjectURL(url);
    });
}

function makeOpenSCAD(image: PartListImage, settings: ThreeDSettings) {
    const { pixelSize, heightPerLayer, baseHeight } = settings;
    const zip = new JSZip();
    
    // Generate one PNG per color
    const imagePromises: Promise<void>[] = [];
    
    for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        
        // Fill white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels for this color
        ctx.fillStyle = "black";
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIndex) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const color = image.partList[partIndex].target;
        const safeName = color.name.replace(/[^a-zA-Z0-9]/g, "_");
        
        imagePromises.push(
            new Promise<void>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        zip.file(`${safeName}.png`, blob);
                    }
                    resolve();
                }, "image/png")
            })
        );
    }
    
    // Generate OpenSCAD file
    Promise.all(imagePromises).then(() => {
        const scadLines: string[] = [];
        
        scadLines.push(`// Generated 3D model`);
        scadLines.push(`// Image size: ${image.width} x ${image.height}`);
        scadLines.push(`// Pixel size: ${pixelSize}mm`);
        scadLines.push(`// Layer height: ${heightPerLayer}mm`);
        scadLines.push(``);
        
        // Base layer
        scadLines.push(`// Base layer`);
        scadLines.push(`color("gray")`);
        scadLines.push(`translate([0, 0, 0])`);
        scadLines.push(`cube([${image.width * pixelSize}, ${image.height * pixelSize}, ${baseHeight}]);`);
        scadLines.push(``);
        
        // Color layers
        for (let partIndex = 0; partIndex < image.partList.length; partIndex++) {
            const color = image.partList[partIndex].target;
            const safeName = color.name.replace(/[^a-zA-Z0-9]/g, "_");
            const colorHex = colorEntryToHex(color);
            const z = baseHeight + partIndex * heightPerLayer;
            
            scadLines.push(`// ${color.name}`);
            scadLines.push(`color("${colorHex}")`);
            scadLines.push(`translate([0, 0, ${z}])`);
            scadLines.push(`scale([${pixelSize}, ${pixelSize}, ${heightPerLayer}])`);
            scadLines.push(`surface(file = "${safeName}.png", center = false, invert = true);`);
            scadLines.push(``);
        }
        
        zip.file("model.scad", scadLines.join('\n'));
        
        zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "model_openscad.zip";
            a.click();
            URL.revokeObjectURL(url);
        });
    });
}
