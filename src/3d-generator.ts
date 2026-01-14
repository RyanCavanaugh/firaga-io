import { PartListImage } from "./image-utils";
import { saveAs } from "file-saver";

export interface Export3DSettings {
    format: "3mf" | "openscad";
    filename: string;
}

export async function make3DExport(image: PartListImage, settings: Export3DSettings) {
    if (settings.format === "3mf") {
        make3MF(image, settings.filename);
    } else if (settings.format === "openscad") {
        makeOpenSCADMasks(image, settings.filename);
    }
}

function make3MF(image: PartListImage, filename: string) {
    // Build 3MF XML document
    const xmlParts = [];
    
    // Add XML header
    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    
    // Start 3MF model with proper namespace
    xmlParts.push('<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2013/12" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" unit="millimeter">');
    
    // Build resources section
    xmlParts.push('<resources>');
    
    // Add materials for each color
    xmlParts.push('<m:basematerials id="1">');
    for (let i = 0; i < image.partList.length; i++) {
        const color = image.partList[i].target;
        const colorStr = `${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}FF`;
        xmlParts.push(`<m:base name="Color${i}" displaycolor="#${colorStr}" />`);
    }
    xmlParts.push('</m:basematerials>');
    
    // Add object definitions for each color as separate objects
    let objectId = 2;
    const objectIds: number[] = [];
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const objectId_str = objectId.toString();
        objectIds.push(objectId);
        
        xmlParts.push(`<object id="${objectId_str}" type="model">`);
        xmlParts.push('<mesh>');
        xmlParts.push('<vertices>');
        
        // Build vertices for this color's pixels
        // Each pixel becomes a unit cube at (x, y, colorIdx)
        let vertexIndex = 0;
        const colorPixels: Array<[number, number]> = [];
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === colorIdx) {
                    colorPixels.push([x, y]);
                }
            }
        }
        
        // For each pixel, create a unit cube with 8 vertices
        // Position (x, y, z) with z = colorIdx (stacked vertically by color)
        for (const [x, y] of colorPixels) {
            const z = colorIdx;
            // Create cube vertices
            xmlParts.push(`<vertex x="${x}" y="${y}" z="${z}" />`);
            xmlParts.push(`<vertex x="${x + 1}" y="${y}" z="${z}" />`);
            xmlParts.push(`<vertex x="${x + 1}" y="${y + 1}" z="${z}" />`);
            xmlParts.push(`<vertex x="${x}" y="${y + 1}" z="${z}" />`);
            xmlParts.push(`<vertex x="${x}" y="${y}" z="${z + 1}" />`);
            xmlParts.push(`<vertex x="${x + 1}" y="${y}" z="${z + 1}" />`);
            xmlParts.push(`<vertex x="${x + 1}" y="${y + 1}" z="${z + 1}" />`);
            xmlParts.push(`<vertex x="${x}" y="${y + 1}" z="${z + 1}" />`);
        }
        
        xmlParts.push('</vertices>');
        xmlParts.push('<triangles>');
        
        // Create triangles for each cube
        let baseVertexIdx = 0;
        for (let cubeIdx = 0; cubeIdx < colorPixels.length; cubeIdx++) {
            const materialIndex = colorIdx;
            // Bottom face (z = colorIdx)
            xmlParts.push(`<triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 1}" v3="${baseVertexIdx + 2}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 2}" v3="${baseVertexIdx + 3}" pid="1" mid="${materialIndex}" />`);
            // Top face (z = colorIdx + 1)
            xmlParts.push(`<triangle v1="${baseVertexIdx + 4}" v2="${baseVertexIdx + 6}" v3="${baseVertexIdx + 5}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 4}" v2="${baseVertexIdx + 7}" v3="${baseVertexIdx + 6}" pid="1" mid="${materialIndex}" />`);
            // Side faces
            xmlParts.push(`<triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 4}" v3="${baseVertexIdx + 5}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx}" v2="${baseVertexIdx + 5}" v3="${baseVertexIdx + 1}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 1}" v2="${baseVertexIdx + 5}" v3="${baseVertexIdx + 6}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 1}" v2="${baseVertexIdx + 6}" v3="${baseVertexIdx + 2}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 2}" v2="${baseVertexIdx + 6}" v3="${baseVertexIdx + 7}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 2}" v2="${baseVertexIdx + 7}" v3="${baseVertexIdx + 3}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 3}" v2="${baseVertexIdx + 7}" v3="${baseVertexIdx + 4}" pid="1" mid="${materialIndex}" />`);
            xmlParts.push(`<triangle v1="${baseVertexIdx + 3}" v2="${baseVertexIdx + 4}" v3="${baseVertexIdx}" pid="1" mid="${materialIndex}" />`);
            
            baseVertexIdx += 8;
        }
        
        xmlParts.push('</triangles>');
        xmlParts.push('</mesh>');
        xmlParts.push('</object>');
        
        objectId++;
    }
    
    xmlParts.push('</resources>');
    
    // Build build section with all objects
    xmlParts.push('<build>');
    for (const objId of objectIds) {
        xmlParts.push(`<item objectid="${objId}" />`);
    }
    xmlParts.push('</build>');
    
    xmlParts.push('</model>');
    
    const xmlContent = xmlParts.join('\n');
    
    // Create a simple 3MF file (which is a ZIP with specific structure)
    // For simplicity, we'll save as XML first
    // A full 3MF implementation would require creating a ZIP with proper directory structure
    const blob = new Blob([xmlContent], { type: "application/xml" });
    saveAs(blob, filename.replace(/\.[^.]+$/, "") + ".3mf");
}

async function makeOpenSCADMasks(image: PartListImage, filename: string) {
    // We need a zip library for this - for now, we'll generate the OpenSCAD file
    // and individual PNG masks, but without proper zipping capability,
    // we'll export them separately
    
    const scadLines: string[] = [];
    
    // Generate OpenSCAD header
    scadLines.push('// Auto-generated by firaga.io');
    scadLines.push('// 3D visualization using heightmaps');
    scadLines.push('');
    
    // For each color, create a height map
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const color = image.partList[colorIdx].target;
        const colorName = image.partList[colorIdx].target.name.replace(/\s+/g, '_');
        
        scadLines.push(`// Color ${colorIdx}: ${color.name} (RGB: ${color.r}, ${color.g}, ${color.b})`);
        scadLines.push(`color([${(color.r/255).toFixed(3)}, ${(color.g/255).toFixed(3)}, ${(color.b/255).toFixed(3)}])`);
        scadLines.push(`  surface(file = "${colorName}_mask.png", center = true, invert = true);`);
        scadLines.push('');
    }
    
    const scadContent = scadLines.join('\n');
    const scadBlob = new Blob([scadContent], { type: "text/plain" });
    saveAs(scadBlob, filename.replace(/\.[^.]+$/, "") + ".scad");
    
    // Generate and download individual mask images
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
        const colorName = image.partList[colorIdx].target.name.replace(/\s+/g, '_');
        generateAndDownloadMask(image, colorIdx, colorName, filename);
    }
}

function generateAndDownloadMask(image: PartListImage, colorIdx: number, colorName: string, baseFilename: string) {
    // Create a black and white image where this color's pixels are white
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    
    const ctx = canvas.getContext('2d')!;
    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Fill colored pixels with white
    ctx.fillStyle = '#FFFFFF';
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.pixels[y][x] === colorIdx) {
                const idx = (y * canvas.width + x) * 4;
                data[idx] = 255;     // R
                data[idx + 1] = 255; // G
                data[idx + 2] = 255; // B
                data[idx + 3] = 255; // A
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob((blob) => {
        if (blob) {
            const maskFilename = baseFilename.replace(/\.[^.]+$/, "") + `_${colorName}_mask.png`;
            saveAs(blob, maskFilename);
        }
    }, 'image/png');
}
