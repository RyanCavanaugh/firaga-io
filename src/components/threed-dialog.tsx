import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeMFOptions } from '../generators/3mf-generator';
import { generateOpenSCADMasksAsDataURLs, OpenSCADOptions } from '../generators/openscad-generator';
import { PropContext } from './context';
import { saveAs } from 'file-saver';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type OutputFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<OutputFormat>('3mf');
    const [pixelWidth, setPixelWidth] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(5);
    const [baseHeight, setBaseHeight] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} {...props} />
            <DimensionsGroup 
                pixelWidth={pixelWidth} 
                setPixelWidth={setPixelWidth}
                pixelHeight={pixelHeight}
                setPixelHeight={setPixelHeight}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const options = {
            filename: props.filename.replace('.png', ''),
            pixelWidth,
            pixelHeight,
            baseHeight
        };

        window.clarity?.("event", "export-3d", format);

        if (format === '3mf') {
            export3MF(options);
        } else {
            exportOpenSCAD(options);
        }
    }

    function export3MF(options: ThreeMFOptions) {
        const blob = generate3MF(props.image, options);
        saveAs(blob, `${options.filename}.3mf`);
    }

    function exportOpenSCAD(options: OpenSCADOptions) {
        const masks = generateOpenSCADMasksAsDataURLs(props.image);
        
        // Generate SCAD content
        const { pixelWidth, pixelHeight, baseHeight, filename } = options;
        const { width, height } = props.image;

        let scadContent = `// Generated OpenSCAD file for ${filename}
// Pixel dimensions: ${width}x${height}
// Physical size: ${width * pixelWidth}mm x ${height * pixelHeight}mm

pixel_width = ${pixelWidth};
pixel_height = ${pixelHeight};
base_height = ${baseHeight};

`;

        // For each mask, add a surface command
        for (const mask of masks) {
            const r = mask.color.r / 255;
            const g = mask.color.g / 255;
            const b = mask.color.b / 255;

            scadContent += `
// ${mask.name}
color([${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}])
scale([pixel_width, pixel_height, base_height])
surface(file = "${mask.name}.png", invert = true);

`;
        }

        // Create ZIP-like package with all files
        // Since we don't have JSZip, we'll download files individually
        // In production, add JSZip to package.json
        
        // Download SCAD file
        const scadBlob = new Blob([scadContent], { type: 'text/plain' });
        saveAs(scadBlob, `${filename}.scad`);

        // Download each mask image
        masks.forEach(mask => {
            fetch(mask.dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    saveAs(blob, `${mask.name}.png`);
                });
        });
    }
}

function FormatGroup(props: { format: OutputFormat; setFormat: (f: OutputFormat) => void; image: PartListImage }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio" 
                    name="3d-format" 
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} 
                />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio" 
                    name="3d-format" 
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Export as 3MF triangle mesh with separate shapes for each color. Compatible with 3D printing software.'
                : 'Export as OpenSCAD file with heightmap masks. One black/white image per color.'}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelWidth: number;
    setPixelWidth: (n: number) => void;
    pixelHeight: number;
    setPixelHeight: (n: number) => void;
    baseHeight: number;
    setBaseHeight: (n: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-inputs">
            <label>
                Pixel Width:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelWidth} 
                    onInput={(e) => props.setPixelWidth(parseFloat((e.target as HTMLInputElement).value))} 
                />
            </label>
            <label>
                Pixel Height:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelHeight} 
                    onInput={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} 
                />
            </label>
            <label>
                Base Height:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.baseHeight} 
                    onInput={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))} 
                />
            </label>
        </div>
        <span class="description">
            Physical dimensions for each pixel in millimeters.
        </span>
    </div>;
}
