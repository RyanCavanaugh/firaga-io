import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
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
            <button class="print" onClick={() => generate3DOutput()}>Export 3D</button>
        </div>
    </div>;

    function generate3DOutput() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pitch: getPitch(props.gridSize),
            height: props.settings.height,
        };

        window.clarity?.("event", "3d-export");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDOutput"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDOutput"][K];
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
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate materials for each color. Compatible with most 3D software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing one black/white image per color and an OpenSCAD file to combine them into a 3D model.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Layer Height (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Thin layers",
            icon: <span class="height-icon">▬</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Medium layers",
            icon: <span class="height-icon">▬▬</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Thick layers",
            icon: <span class="height-icon">▬▬▬</span>
        },
    ]
}));

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
                            updateProp("threeDOutput", p.key, v.value);
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
