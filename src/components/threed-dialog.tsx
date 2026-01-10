import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3DExport, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { getGridSize, getPitch } from '../utils';
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
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            heightMm: props.settings.heightMm,
            pixelSizeMm: getPitch(props.gridSize),
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ''),
        };

        window.clarity?.("event", "3d-export");
        make3DExport(props.image, settings);
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
            description: "3D Manufacturing Format - triangle mesh with separate shapes per color. Compatible with most 3D slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "Zip file with black/white heightmap images and OpenSCAD script to generate 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "heightMm",
    title: "Height",
    values: [
        {
            title: "Thin",
            value: 1,
            description: "1mm height",
            icon: <span class="height-icon">─</span>
        },
        {
            title: "Medium",
            value: 3,
            description: "3mm height",
            icon: <span class="height-icon">━</span>
        },
        {
            title: "Thick",
            value: 5,
            description: "5mm height",
            icon: <span class="height-icon">█</span>
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
