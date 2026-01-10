import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../exporters/3mf-generator';
import { generateOpenSCADMasks } from '../exporters/openscad-generator';

export type Export3DDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export type Export3DFormat = "3mf" | "openscad";

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>("3mf");

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        window.clarity?.("event", "3d-export");
        const filename = props.filename.replace(".png", "");
        
        if (format === "3mf") {
            generate3MF(props.image, filename);
        } else {
            generateOpenSCADMasks(props.image, filename);
        }
        
        updateProp("ui", "is3DExportOpen", false);
    }
}

function FormatGroup(props: Export3DDialogProps & { format: Export3DFormat, setFormat: (f: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Export Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Standard 3D printing format with separate material shapes for each color"
                : "Zip file with monochrome images per color and OpenSCAD file for 3D display"}
        </span>
    </div>;
}
