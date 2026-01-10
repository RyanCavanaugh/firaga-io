import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../threed-3mf';
import { generateOpenSCADMasks } from '../threed-openscad';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type ExportFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const filename = props.filename.replace(".png", "");
        window.clarity?.("event", "3d-export");
        
        if (format === '3mf') {
            generate3MF(props.image, filename);
        } else {
            generateOpenSCADMasks(props.image, filename);
        }
        
        updateProp("ui", "is3DOpen", false);
    }
}

function FormatGroup(props: { format: ExportFormat; setFormat: (f: ExportFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? "3MF triangle mesh with separate material shapes for each color"
                : "ZIP file with monochrome images per color and OpenSCAD file"}
        </span>
    </div>;
}
