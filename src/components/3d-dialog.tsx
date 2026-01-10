import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3mf-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    pitch: number;
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDSettings["format"];
    height: number;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pitch: props.pitch,
            height: props.settings.height
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as a 3MF triangle mesh with separate material shapes for each color. Compatible with most 3D modeling software.",
            icon: <span class="format-3mf">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as a zip file with monochrome masks and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-openscad">📦</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Voxel Height",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Thin layers (1mm)",
            icon: <span class="height-1">━</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Medium layers (2mm)",
            icon: <span class="height-2">▬</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Thick layers (5mm)",
            icon: <span class="height-5">█</span>
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
