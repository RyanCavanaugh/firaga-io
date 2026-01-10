import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../three-d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <LayerHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            layerHeight: props.settings.layerHeight,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
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
    settings: AppProps["threeD"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as ThreeDFormat,
            title: "3MF Mesh",
            description: "Industry-standard 3D Manufacturing Format with separate colored materials. Compatible with most 3D software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad-masks" as ThreeDFormat,
            title: "OpenSCAD Masks",
            description: "Zip file with black/white mask images and OpenSCAD file using heightmap layers.",
            icon: <span class="format-icon">📦</span>,
        },
    ]
}));

const LayerHeightGroup = makeRadioGroup(() => ({
    key: "layerHeight",
    title: "Layer Height",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "Thin layers (0.5mm)",
            icon: <span class="height-icon">▁</span>
        },
        {
            title: "1mm",
            value: 1.0,
            description: "Standard layers (1mm)",
            icon: <span class="height-icon">▂</span>
        },
        {
            title: "2mm",
            value: 2.0,
            description: "Thick layers (2mm)",
            icon: <span class="height-icon">▄</span>
        },
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threeD"]>(factory: OptionGroupFactory<K>) {
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
