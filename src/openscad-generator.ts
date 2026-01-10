import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

declare const JSZip: any;

export async function generateOpenSCAD(image: PartListImage, filename: string) {
    // Load JSZip dynamically
    await loadJSZip();
    
    const zip = new JSZip();
    
    // Create a monochrome image for each color
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    
    const scadParts: string[] = [];
    
    for (let partIdx = 0; partIdx < image.partList.length; partIdx++) {
        const part = image.partList[partIdx];
        
        // Create black and white image data
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelIdx = image.pixels[y][x];
                const dataIdx = (y * image.width + x) * 4;
                
                if (pixelIdx === partIdx) {
                    // White pixel where this color appears
                    imageData.data[dataIdx] = 255;     // R
                    imageData.data[dataIdx + 1] = 255; // G
                    imageData.data[dataIdx + 2] = 255; // B
                    imageData.data[dataIdx + 3] = 255; // A
                } else {
                    // Black pixel elsewhere
                    imageData.data[dataIdx] = 0;       // R
                    imageData.data[dataIdx + 1] = 0;   // G
                    imageData.data[dataIdx + 2] = 0;   // B
                    imageData.data[dataIdx + 3] = 255; // A
                }
            }
        }
        
        // Draw to canvas and export as PNG
        ctx.putImageData(imageData, 0, 0);
        const pngData = await new Promise<string>((resolve) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Extract base64 data
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.readAsDataURL(blob!);
            }, 'image/png');
        });
        
        // Add to zip
        const safeName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${safeName}_${partIdx}.png`, pngData, { base64: true });
        
        // Add to SCAD file
        const hex = colorEntryToHex(part.target);
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        
        scadParts.push(`
// ${part.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
translate([0, 0, ${partIdx * 0.5}])
scale([1, 1, 0.5])
surface(file = "${safeName}_${partIdx}.png", center = true, invert = true);
`);
    }
    
    // Create the OpenSCAD file
    const scadContent = `// Generated from ${filename}
// Each color layer is represented as a heightmap

${scadParts.join('\n')}
`;
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate and download the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_openscad.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadJSZip() {
    const tagName = "jszip-script-tag";
    const scriptEl = document.getElementById(tagName);
    
    if (scriptEl === null) {
        return new Promise<void>((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error('Failed to load JSZip'));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            document.head.appendChild(tag);
        });
    }
}
