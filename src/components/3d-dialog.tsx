import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../exporters/3mf-generator';
import { generateOpenSCADMasks } from '../exporters/openscad-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} image={props.image} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        window.clarity?.("event", "export-3d");
        if (format === '3mf') {
            generate3MF(props.image, props.filename);
        } else {
            generateOpenSCADMasks(props.image, props.filename);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad'; setFormat: (f: '3mf' | 'openscad') => void; image: PartListImage }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
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
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Triangle mesh in 3MF format with separate material shapes for each color'
                : 'ZIP file containing monochrome images and an OpenSCAD file for 3D visualization'}
        </span>
    </div>;
}
