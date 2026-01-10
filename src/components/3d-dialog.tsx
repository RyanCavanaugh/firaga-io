import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3mf, ThreeMfSettings } from '../3mf-generator';
import { generateOpenScadMasks, OpenScadSettings } from '../openscad-generator';
import { saveAs } from 'file-saver';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelSize, setPixelSize] = useState(2.5);
    const [pixelHeight, setPixelHeight] = useState(2.0);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup 
                format={format} 
                pixelSize={pixelSize}
                setPixelSize={setPixelSize}
                pixelHeight={pixelHeight}
                setPixelHeight={setPixelHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3dOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        window.clarity?.("event", "export-3d");
        
        if (format === '3mf') {
            const settings: ThreeMfSettings = {
                pixelWidth: pixelSize,
                pixelDepth: pixelSize,
                pixelHeight: pixelHeight
            };
            const blob = generate3mf(props.image, settings);
            const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '') + '.3mf';
            saveAs(blob, filename);
        } else {
            const settings: OpenScadSettings = {
                pixelSize: pixelSize,
                heightScale: pixelHeight
            };
            const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '');
            generateOpenScadMasks(props.image, settings, filename);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: 'openscad' | '3mf', setFormat: (f: 'openscad' | '3mf') => void }) {
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
                    <span>📐</span>
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
                    <span>🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Standard 3D manufacturing format with separate colored shapes. Compatible with 3D printing slicers.'
                : 'ZIP file with mask images and OpenSCAD script. Use OpenSCAD to customize and render.'}
        </span>
    </div>;
}

function SettingsGroup(props: {
    format: 'openscad' | '3mf';
    pixelSize: number;
    setPixelSize: (v: number) => void;
    pixelHeight: number;
    setPixelHeight: (v: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Settings</h1>
        <div class="print-setting-group-options">
            <div class="option">
                <label>
                    Pixel Size (mm):
                    <input 
                        type="number" 
                        min="0.5" 
                        max="50" 
                        step="0.5"
                        value={props.pixelSize}
                        onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    Pixel Height (mm):
                    <input 
                        type="number" 
                        min="0.5" 
                        max="50" 
                        step="0.5"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Adjust the physical dimensions of each pixel in the 3D model.
        </span>
    </div>;
}
