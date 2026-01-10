import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { make3MF } from '../3mf-generator';
import { makeOpenSCADMasks } from '../openscad-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export</button>
        </div>
    </div>;

    function export3D() {
        window.clarity?.("event", "export-3d");
        
        if (format === "3mf") {
            make3MF(props.image, props.filename);
        } else {
            makeOpenSCADMasks(props.image, props.filename);
        }
        
        updateProp("ui", "is3DOpen", false);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    format: "3mf" | "openscad";
    filename: string;
};

type FormatGroupProps = {
    format: "3mf" | "openscad";
    setFormat: (format: "3mf" | "openscad") => void;
};

const FormatGroup = (props: FormatGroupProps) => {
    return <div class="print-setting-group">
        <h1>3D Output Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">{getDescription()}</span>
    </div>;
    
    function getDescription() {
        if (props.format === "3mf") {
            return "3MF file with separate material shapes for each color. Standard industry format compatible with most 3D software.";
        } else {
            return "ZIP file containing black/white mask images for each color and an OpenSCAD file that combines them into a 3D display.";
        }
    }
};

