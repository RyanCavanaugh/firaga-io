import * as preact from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { makeThreeD, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps): preact.JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "isThreeDOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            height: props.settings.height,
            pitch: getPitch(props.gridSize),
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        makeThreeD(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | preact.JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | preact.JSX.Element;
        icon: preact.JSX.Element;
        description: string | preact.JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format" as const,
    values: [
        {
            value: "3mf" as const,
            title: "3MF",
            description: "3D Manufacturing Format - industry standard triangle mesh with materials. Can be imported into most 3D software and slicers.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD",
            description: "ZIP file with mask images and OpenSCAD file. Use surface() heightmaps to create 3D models from 2D images.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    title: "Block Height",
    key: "height" as const,
    values: [
        {
            value: 2.5,
            title: "Thin",
            description: "2.5mm height - minimal thickness",
            icon: <span class="height-icon">▁</span>,
        },
        {
            value: 5,
            title: "Standard",
            description: "5mm height - good for most uses",
            icon: <span class="height-icon">▄</span>,
        },
        {
            value: 10,
            title: "Thick",
            description: "10mm height - chunky blocks",
            icon: <span class="height-icon">█</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): preact.JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
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
