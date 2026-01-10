import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>('3mf');
    const [pixelWidth, setPixelWidth] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelWidth={pixelWidth} 
                pixelHeight={pixelHeight}
                setPixelWidth={setPixelWidth}
                setPixelHeight={setPixelHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;
    
    async function handleExport(): Promise<void> {
        window.clarity?.("event", "export-3d", format);
        await generate3D(props.image, {
            format,
            filename: props.filename.replace(/\.(png|jpe?g)$/i, ''),
            pixelWidth,
            pixelHeight
        });
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ThreeDFormat; setFormat: (f: ThreeDFormat) => void }): JSX.Element {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    value="3mf"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    value="openscad"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Standard 3D manufacturing format with separate meshes per color. Compatible with most 3D printing software.'
                : 'Zip file containing monochrome masks and OpenSCAD script for parametric 3D model generation.'}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelWidth: number;
    pixelHeight: number;
    setPixelWidth: (w: number) => void;
    setPixelHeight: (h: number) => void;
}): JSX.Element {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-control">
                <label>
                    Pixel Width:
                    <input 
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelWidth}
                        onChange={(e) => props.setPixelWidth(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    mm
                </label>
            </div>
            <div class="dimension-control">
                <label>
                    Pixel Height:
                    <input 
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    mm
                </label>
            </div>
        </div>
        <span class="description">
            Pixel width controls the X/Y dimensions of each pixel. Pixel height controls the Z thickness.
        </span>
    </div>;
}
