import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

export function generateOpenSCADZip(image: PartListImage): Blob {
    // Since we don't have JSZip, we'll create a simple tar-like format
    // For now, let's create individual files and let the user combine them
    // A proper implementation would require adding JSZip as a dependency
    
    // For this prototype, we'll create a single HTML file that contains all the data
    // and instructions for the user
    const html = generateHTMLPackage(image);
    return new Blob([html], { type: 'text/html' });
}

function generateHTMLPackage(image: PartListImage): string {
    const images: string[] = [];
    const scadFile = generateOpenSCADFile(image);
    
    // Generate PNG images for each color
    image.partList.forEach((part, partIdx) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, image.width, image.height);
        
        // Draw black pixels where this color appears
        ctx.fillStyle = 'black';
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                if (image.pixels[y][x] === partIdx) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        const dataURL = canvas.toDataURL('image/png');
        images.push(`
        <div class="file">
            <h3>color_${partIdx}_${sanitizeFilename(part.target.name)}.png</h3>
            <img src="${dataURL}" style="image-rendering: pixelated; max-width: 400px;" />
            <a href="${dataURL}" download="color_${partIdx}_${sanitizeFilename(part.target.name)}.png">Download</a>
        </div>
        `);
    });
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OpenSCAD Heightmap Package</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .file { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        .download-all { margin: 20px 0; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
        a { display: inline-block; margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; }
        a:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>OpenSCAD Heightmap Package</h1>
    <p>Download each image and the .scad file below to create a 3D model.</p>
    
    <h2>Instructions</h2>
    <ol>
        <li>Download all the images below (click the "Download" link under each)</li>
        <li>Download the .scad file</li>
        <li>Place all files in the same directory</li>
        <li>Open the .scad file in OpenSCAD</li>
        <li>Render the model (F6) and export as STL</li>
    </ol>
    
    <div class="file">
        <h3>model.scad</h3>
        <pre>${escapeHtml(scadFile)}</pre>
        <a href="data:text/plain;charset=utf-8,${encodeURIComponent(scadFile)}" download="model.scad">Download</a>
    </div>
    
    <h2>Color Layer Images</h2>
    ${images.join('\n')}
    
    <script>
        // Add functionality to download all files at once
        const downloadAll = () => {
            const links = document.querySelectorAll('a[download]');
            links.forEach((link, idx) => {
                setTimeout(() => {
                    link.click();
                }, idx * 500);
            });
        };
    </script>
    <div class="download-all">
        <button onclick="downloadAll()">Download All Files</button>
    </div>
</body>
</html>`;
}

function generateOpenSCADFile(image: PartListImage): string {
    const layers = image.partList.map((part, partIdx) => {
        const hex = colorEntryToHex(part.target);
        const filename = `color_${partIdx}_${sanitizeFilename(part.target.name)}.png`;
        
        return `// Layer ${partIdx}: ${part.target.name} (${hex})
color("${hex}")
translate([0, 0, ${partIdx * 0.5}])
surface(file = "${filename}", center = true, invert = true);
`;
    }).join('\n');
    
    return `// OpenSCAD model generated from pixel art
// Image dimensions: ${image.width} x ${image.height}

scale([1, 1, 0.5]) {
${layers}
}
`;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
