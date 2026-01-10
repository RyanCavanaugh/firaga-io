import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [height, setHeight] = useState<number>(2.0);
    const [baseThickness, setBaseThickness] = useState<number>(1.0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup 
                height={height} 
                setHeight={setHeight}
                baseThickness={baseThickness}
                setBaseThickness={setBaseThickness}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            height,
            baseThickness
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (f: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
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
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Standard 3MF file with separate material shapes for each color. Compatible with most 3D printers and slicers.'
                : 'ZIP file containing monochrome mask images and an OpenSCAD file that combines them into a 3D display.'}
        </span>
    </div>;
}

function SettingsGroup(props: { 
    height: number, 
    setHeight: (h: number) => void,
    baseThickness: number,
    setBaseThickness: (t: number) => void
}) {
    return <div class="print-setting-group">
        <h1>3D Settings</h1>
        <div class="settings-inputs">
            <label>
                <span>Pixel Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.height}
                    onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Thickness (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.baseThickness}
                    onChange={(e) => props.setBaseThickness(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel height controls how tall each colored pixel is. Base thickness is the foundation layer.
        </span>
    </div>;
}
