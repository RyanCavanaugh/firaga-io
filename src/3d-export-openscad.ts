import { saveAs } from 'file-saver';
import { PartListImage } from './image-utils';
import JSZip = require('jszip');

export async function generateOpenSCADMasks(image: PartListImage, filename: string) {
    const zip = new JSZip();
    
    // Generate one PNG mask per color
    const maskPromises = image.partList.map(async (part, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white (background)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === idx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const sanitizedName = part.target.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`mask_${idx}_${sanitizedName}.png`, blob);
        
        return { idx, name: sanitizedName };
    });
    
    const masks = await Promise.all(maskPromises);
    
    // Generate OpenSCAD file
    let scadContent = `// OpenSCAD file for ${filename}
// Generated masks for heightmap display

`;
    
    masks.forEach(({ idx, name }) => {
        const colorPart = image.partList[idx];
        const r = colorPart.target.r / 255;
        const g = colorPart.target.g / 255;
        const b = colorPart.target.b / 255;
        
        scadContent += `// ${colorPart.target.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
  translate([0, 0, ${idx * 0.1}])
    surface(file = "mask_${idx}_${name}.png", center = true, invert = true);

`;
    });
    
    zip.file(`${filename}.scad`, scadContent);
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${filename}_openscad.zip`);
}
