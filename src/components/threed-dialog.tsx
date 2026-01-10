import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pitch: getPitch(props.gridSize),
            height: 2.5, // Default height in mm
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - a standard 3D triangle mesh with separate colored shapes. Compatible with most 3D slicing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome mask images (one per color) and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const HeightGroup = (_props: ThreeDDialogProps) => {
    return <div class="print-setting-group">
        <h1>Block Height</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Height (mm): </span>
                <input type="number" min="0.5" max="10" step="0.5" value="2.5" />
            </label>
        </div>
        <span class="description">Height of each pixel block in millimeters</span>
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
                            updateProp("threed", p.key, v.value);
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
