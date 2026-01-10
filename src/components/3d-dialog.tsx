import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3DSettings } from '../export-3mf';
import { exportOpenSCADMasks } from '../export-openscad';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelHeight, setPixelHeight] = useState<number>(2.0);
    const pitch = getPitch(props.gridSize);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup pixelHeight={pixelHeight} setPixelHeight={setPixelHeight} pitch={pitch} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D Model</button>
        </div>
    </div>;

    function exportModel() {
        const settings: Export3DSettings = {
            pitch,
            height: pixelHeight
        };

        window.clarity?.("event", "export-3d", format);
        
        if (format === '3mf') {
            export3MF(props.image, settings);
        } else {
            exportOpenSCADMasks(props.image, settings);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (f: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' ? 
                '3MF is a 3D manufacturing format with separate colored shapes for each color. Compatible with most 3D printing software.' :
                'OpenSCAD format generates a ZIP file with black/white mask images and a .scad script that combines them into a 3D model using heightmaps.'}
        </span>
    </div>;
}

function SettingsGroup(props: { pixelHeight: number, setPixelHeight: (h: number) => void, pitch: number }) {
    return <div class="print-setting-group">
        <h1>Settings</h1>
        <div class="settings-controls">
            <div class="setting-item">
                <label for="pixel-height">Pixel Height (mm):</label>
                <input 
                    id="pixel-height"
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" 
                    value={props.pixelHeight}
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </div>
            <div class="setting-item">
                <label>Pixel Pitch:</label>
                <span class="setting-value">{props.pitch.toFixed(2)} mm</span>
            </div>
        </div>
        <span class="description">
            Pixel height determines the vertical thickness/depth of each pixel in the 3D model. 
            Pixel pitch is determined by the material size setting.
        </span>
    </div>;
}
