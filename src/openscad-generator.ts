import { PartListImage } from "./image-utils";
import JSZip from 'jszip';

export interface OpenSCADSettings {
    height: number; // Height in mm
    baseHeight: number; // Base height in mm
    pixelSize: number; // Size of each pixel in mm
}

export async function generateOpenSCADMasks(image: PartListImage, settings: OpenSCADSettings): Promise<Blob> {
    const { width, height, partList, pixels } = image;
    
    const zip = new JSZip();

    // Create a black and white image for each color
    for (let colorIndex = 0; colorIndex < partList.length; colorIndex++) {
        const color = partList[colorIndex].target;
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
        
        // Convert to PNG blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const safeColorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${safeColorName}.png`, blob);
    }

    // Create OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file('model.scad', scadContent);

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
}

function generateOpenSCADFile(image: PartListImage, settings: OpenSCADSettings): string {
    const { width, height, partList } = image;
    const { pixelSize, baseHeight, height: pixelHeight } = settings;

    let scadCode = `// Generated OpenSCAD file for pixel art
// Image size: ${width} x ${height} pixels
// Pixel size: ${pixelSize} mm
// Base height: ${baseHeight} mm
// Pixel height: ${pixelHeight} mm

`;

    // Add modules for each color
    for (let i = 0; i < partList.length; i++) {
        const color = partList[i].target;
        const safeColorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        const colorRGB = [color.r / 255, color.g / 255, color.b / 255];

        scadCode += `// ${color.name}
module layer_${safeColorName}() {
    color([${colorRGB[0].toFixed(3)}, ${colorRGB[1].toFixed(3)}, ${colorRGB[2].toFixed(3)}])
    translate([0, 0, ${baseHeight}])
    scale([${pixelSize}, ${pixelSize}, ${pixelHeight}])
    surface(file = "${safeColorName}.png", center = false, invert = true);
}

`;
    }

    // Add base layer
    scadCode += `// Base layer
module base() {
    cube([${width * pixelSize}, ${height * pixelSize}, ${baseHeight}]);
}

`;

    // Combine all layers
    scadCode += `// Combined model
union() {
    base();
`;

    for (let i = 0; i < partList.length; i++) {
        const color = partList[i].target;
        const safeColorName = color.name.replace(/[^a-zA-Z0-9]/g, '_');
        scadCode += `    layer_${safeColorName}();\n`;
    }

    scadCode += `}\n`;

    return scadCode;
}
