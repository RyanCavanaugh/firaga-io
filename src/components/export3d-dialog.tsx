import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF, exportOpenSCADMasks } from '../export3d';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} image={props.image} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        window.clarity?.("event", "export3d");
        const filename = props.filename.replace(".png", "");
        
        if (format === '3mf') {
            export3MF(props.image, filename);
        } else {
            exportOpenSCADMasks(props.image, filename);
        }
        
        updateProp("ui", "is3DExportOpen", false);
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (format: '3mf' | 'openscad') => void, image: PartListImage }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
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
                ? "Standard industry 3MF file format with separate material shapes for each color" 
                : "ZIP file containing monochrome images and an OpenSCAD file for 3D rendering"}
        </span>
    </div>;
}
