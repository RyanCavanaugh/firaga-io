import { PartListImage } from './image-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export type ExportOpenSCADSettings = {
    filename: string;
    pixelSize: number;
    heightScale: number;
};

export async function exportOpenSCAD(image: PartListImage, settings: ExportOpenSCADSettings) {
    const zip = new JSZip();
    
    // Create a black and white image for each color
    image.partList.forEach((part, colorIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(image.width, image.height);
        
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const idx = (y * image.width + x) * 4;
                const isColor = image.pixels[y][x] === colorIndex;
                const value = isColor ? 255 : 0;
                
                imageData.data[idx] = value;
                imageData.data[idx + 1] = value;
                imageData.data[idx + 2] = value;
                imageData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }
        
        zip.file(`color_${colorIndex}_${part.target.code}.png`, bytes);
    });
    
    // Create the OpenSCAD file
    const scadContent = generateOpenSCADFile(image, settings);
    zip.file(`${settings.filename}.scad`, scadContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${settings.filename}_openscad.zip`);
}

function generateOpenSCADFile(image: PartListImage, settings: ExportOpenSCADSettings): string {
    const { pixelSize, heightScale } = settings;
    
    const colorModules = image.partList.map((part, colorIndex) => {
        const color = part.target;
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        return `
// ${part.target.name} (${part.target.code})
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  surface(file="color_${colorIndex}_${part.target.code}.png", center=true, invert=true)
    scale([${pixelSize}, ${pixelSize}, ${heightScale}]);`;
    });
    
    return `// Generated OpenSCAD file for pixel art
// Image size: ${image.width}x${image.height}
// Pixel size: ${pixelSize}mm
// Height scale: ${heightScale}

${colorModules.join('\n')}
`;
}
