import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, Output3DFormat, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelWidth: props.settings.pixelWidth,
            pixelHeight: props.settings.pixelHeight,
            baseThickness: props.settings.baseThickness
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ""));
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with one monochrome image per color and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const DimensionsGroup = function(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-inputs">
            <label>
                <span>Pixel Width:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.settings.pixelWidth}
                    onChange={(e: any) => updateProp("threeD", "pixelWidth", parseFloat(e.target.value) || 2.5)}
                />
            </label>
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.settings.pixelHeight}
                    onChange={(e: any) => updateProp("threeD", "pixelHeight", parseFloat(e.target.value) || 2.5)}
                />
            </label>
            <label>
                <span>Base Thickness:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.settings.baseThickness}
                    onChange={(e: any) => updateProp("threeD", "baseThickness", parseFloat(e.target.value) || 2.0)}
                />
            </label>
        </div>
        <span class="description">
            Controls the size of each pixel in the 3D model. Default values approximate Perler bead dimensions.
        </span>
    </div>;
};

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threeD", p.key, v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}
