import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF, exportOpenSCADMasks } from '../3d-exporters';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        window.clarity?.("event", "3d-export");
        
        if (format === '3mf') {
            export3MF(props.image, props.filename.replace(".png", ""));
        } else {
            exportOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        }
        
        updateProp("ui", "is3DExportOpen", false);
    }
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (f: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
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
                ? "Export as 3MF file with separate material shapes for each color"
                : "Export as ZIP with heightmap masks and OpenSCAD file"}
        </span>
    </div>;
}
