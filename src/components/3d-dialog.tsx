import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [selectedFormat, setSelectedFormat] = useState<Export3DFormat>('3mf');
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup selectedFormat={selectedFormat} onFormatChange={setSelectedFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: selectedFormat,
            materialSize: props.materialSize,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    materialSize: AppProps["material"]["size"];
    filename: string;
};

function FormatGroup(props: { selectedFormat: Export3DFormat, onFormatChange: (format: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio" 
                    name="3d-format" 
                    checked={props.selectedFormat === '3mf'}
                    onChange={() => props.onFormatChange('3mf')} 
                />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio" 
                    name="3d-format" 
                    checked={props.selectedFormat === 'openscad-masks'}
                    onChange={() => props.onFormatChange('openscad-masks')} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.selectedFormat === '3mf' 
                ? 'Industry standard 3MF file with separate colored shapes for each color'
                : 'ZIP file containing black/white mask images and an OpenSCAD script using heightmap display'
            }
        </span>
    </div>;
}
