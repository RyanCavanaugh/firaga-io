import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [height, setHeight] = useState<number>(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        const filename = props.filename.replace(".png", "");
        
        if (format === '3mf') {
            const settings: Export3MFSettings = {
                filename,
                height
            };
            window.clarity?.("event", "export-3mf");
            export3MF(props.image, settings);
        } else {
            const settings: ExportOpenSCADSettings = {
                filename,
                height
            };
            window.clarity?.("event", "export-openscad");
            exportOpenSCADMasks(props.image, settings);
        }
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (f: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Export as a 3MF file with separate material shapes for each color. Can be opened in most 3D printing software.'
                : 'Export as a ZIP file containing mask images and an OpenSCAD file that combines them into a 3D display.'}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="height-control">
            <input 
                type="number" 
                min="0.1" 
                max="10" 
                step="0.1"
                value={props.height}
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
            />
            <span>mm per layer</span>
        </div>
        <span class="description">
            Height of each color layer in the 3D model. Higher values create a thicker, more pronounced 3D effect.
        </span>
    </div>;
}
