import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../three-d-generator';
import { ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export&nbsp;3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", "")
        };

        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

const FormatGroup = function (props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);

    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.settings.format === "3mf"}
                    onChange={() => {
                        updateProp("threeD", "format", "3mf");
                    }} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-preview">3D Model</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.settings.format === "openscad"}
                    onChange={() => {
                        updateProp("threeD", "format", "openscad");
                    }} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-preview">Parametric CAD</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.settings.format === "3mf"
                ? "Export as 3MF (3D Manufacturing Format) for 3D printing. Each color creates a separate material shape."
                : "Export as OpenSCAD project with monochrome masks per color for parametric 3D modeling."}
        </span>
    </div>;
};
