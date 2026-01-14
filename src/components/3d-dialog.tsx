import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3mf, makeOpenScadMasks } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="threed-dialog">
        <div class="threed-options">
            <FormatGroup {...props} />
            <HeightScaleGroup {...props} />
        </div>
        <div class="threed-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3dOpen", false)}>Cancel</button>
            <button class="export" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings = {
            format: props.settings.format,
            heightScale: props.settings.heightScale,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "3d-export");

        if (settings.format === "3mf") {
            make3mf(props.image, settings);
        } else if (settings.format === "openscad-masks") {
            makeOpenScadMasks(props.image, settings);
        }

        updateProp("ui", "is3dOpen", false);
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
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as a 3D triangle mesh in 3MF format. Each color is a separate material. Compatible with most 3D printers and viewers.",
            icon: <span class="threed-format-icon">🔷</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD",
            description: "Export as a zip file containing masks and an OpenSCAD script. Edit heights and combine shapes in OpenSCAD.",
            icon: <span class="threed-format-icon">📦</span>,
        }
    ]
}));

const HeightScaleGroup = makeSliderGroup(({ image }) => ({
    title: "Height Scale",
    key: "heightScale",
    min: 0.1,
    max: 5,
    step: 0.1,
    description: "Scale the height of the 3D model. Higher values create taller peaks."
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="threed-setting-group">
            <h1>{p.title}</h1>
            <div class="threed-setting-group-options">
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

function makeSliderGroup<K extends keyof ThreeDProps>(factory: (props: ThreeDDialogProps) => {
    title: string;
    key: K;
    min: number;
    max: number;
    step: number;
    description: string;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        const value = props.settings[p.key];
        return <div class="threed-setting-group slider-group">
            <h1>{p.title}</h1>
            <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={typeof value === 'number' ? value : 1}
                onChange={(e) => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    updateProp("threeD", p.key, val as any);
                }}
            />
            <span class="slider-value">{typeof value === 'number' ? value.toFixed(1) : value}</span>
            <span class="description">{p.description}</span>
        </div>;
    };
}
