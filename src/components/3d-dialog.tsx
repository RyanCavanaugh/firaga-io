import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { PropContext } from './context';
import { getPitch } from '../utils';
import { AppProps } from '../types';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad-masks'>('3mf');
    const [height, setHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    const pitch = getPitch(props.gridSize);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                height={height} 
                setHeight={setHeight}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D Model</button>
        </div>
    </div>;

    async function exportModel() {
        window.clarity?.("event", "export-3d");
        
        const settings = {
            format,
            height,
            baseHeight,
            pixelSize: pitch
        };

        try {
            let blob: Blob;
            let filename: string;

            if (format === '3mf') {
                blob = await generate3MF(props.image, settings as ThreeDSettings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '.3mf';
            } else {
                blob = await generateOpenSCADMasks(props.image, settings as OpenSCADSettings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '_openscad.zip';
            }

            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Error generating 3D model:', error);
            alert('Error generating 3D model. See console for details.');
        }
    }
}

function FormatGroup(props: { format: '3mf' | 'openscad-masks', setFormat: (f: '3mf' | 'openscad-masks') => void }) {
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
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === 'openscad-masks'}
                    onChange={() => props.setFormat('openscad-masks')} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Standard 3MF file format with separate colored meshes for each color' 
                : 'ZIP file containing monochrome mask images and OpenSCAD file using heightmap functionality'}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    height: number,
    setHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-controls">
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.height}
                    onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value) || 2)}
                />
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.baseHeight}
                    onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value) || 1)}
                />
            </label>
        </div>
        <span class="description">
            Pixel height is the height of each colored pixel above the base. Base height is the thickness of the base layer.
        </span>
    </div>;
}
