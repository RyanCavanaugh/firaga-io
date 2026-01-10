import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: format,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "3d-export");
        make3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ThreeDFormat, setFormat: (f: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Industry standard format."
                : "ZIP file with monochrome mask images and OpenSCAD file using heightmap functionality."}
        </span>
    </div>;
}
