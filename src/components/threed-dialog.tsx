import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PitchGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pitch: props.settings.pitchOverride ?? getPitch(props.gridSize),
            height: props.settings.height,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

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

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate materials per color. Compatible with most 3D printing software.",
            icon: <span class="format-3mf">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file with black/white mask images and OpenSCAD script. Useful for customization.",
            icon: <span class="format-openscad">📦</span>,
        }
    ]
}));

const PitchGroup = makeRadioGroup(() => ({
    key: "pitchOverride",
    title: "Pixel Pitch (optional)",
    values: [
        {
            title: "Auto",
            value: undefined,
            description: "Use the material's default pitch",
            icon: <span class="pitch-auto">⚙️</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm per pixel (Perler beads)",
            icon: <span class="pitch-5">5</span>
        },
        {
            title: "2.5mm",
            value: 2.5,
            description: "2.5mm per pixel (Perler mini)",
            icon: <span class="pitch-2-5">2.5</span>
        },
        {
            title: "Custom",
            value: -1,
            description: "Enter custom pitch",
            icon: <span class="pitch-custom">✏️</span>
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Layer Height",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "1mm tall layers",
            icon: <span class="height-1">1</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm tall layers",
            icon: <span class="height-2">2</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm tall layers (same as Perler pitch)",
            icon: <span class="height-5">5</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
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
