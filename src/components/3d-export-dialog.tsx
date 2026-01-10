import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3d-export/3mf-generator';
import { generateOpenSCADMasks } from '../3d-export/openscad-generator';

export type ThreeDExportDialogProps = {
    image: PartListImage;
    settings: AppProps["threeDExport"];
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export</h1>
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export</button>
        </div>
    </div>;

    function exportModel() {
        const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "");
        
        if (props.settings.format === "3mf") {
            window.clarity?.("event", "export-3mf");
            generate3MF(props.image, filename);
        } else if (props.settings.format === "openscad") {
            window.clarity?.("event", "export-openscad");
            generateOpenSCADMasks(props.image, filename);
        }
    }
}

function FormatGroup(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.settings.format === "3mf"}
                    onChange={() => updateProp("threeDExport", "format", "3mf")} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.settings.format === "openscad"}
                    onChange={() => updateProp("threeDExport", "format", "openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.settings.format === "3mf" 
                ? "Generate a 3MF file with separate material shapes for each color"
                : "Generate a ZIP file with monochrome masks and an OpenSCAD file"}
        </span>
    </div>;
}
