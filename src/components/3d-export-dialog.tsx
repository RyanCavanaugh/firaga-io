import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, generateOpenSCADMasks } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export</button>
        </div>
    </div>;

    function exportFile() {
        window.clarity?.("event", "3d-export");
        if (format === '3mf') {
            generate3MF(props.image, props.filename.replace(".png", ""));
        } else {
            generateOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        }
    }
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (format: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>Output Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF Mesh</h3>
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
                    <span class="format-icon">🗂️</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? "3MF triangle mesh with separate material shapes for each color" 
                : "Zip file with monochrome masks and OpenSCAD file"}
        </span>
    </div>;
}
