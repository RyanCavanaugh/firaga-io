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
            <button class="print" onClick={() => generate3DFile()}>Export 3D</button>
        </div>
    </div>;

    function generate3DFile() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            pitch: getPitch(props.gridSize),
            height: props.settings.height
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
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate material shapes for each color",
            icon: <span class="format-3mf">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white images per color and an OpenSCAD file to combine them",
            icon: <span class="format-openscad">🎭</span>,
        }
    ]
}));

const HeightGroup = makeNumberGroup(() => ({
    title: "Height (mm)",
    key: "height",
    min: 1,
    max: 50,
    step: 1,
    default: 5
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

function makeNumberGroup<K extends keyof ThreeDProps>(factory: (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    min: number;
    max: number;
    step: number;
    default: number;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        const currentValue = props.settings[p.key] as number;
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                <input 
                    type="number" 
                    min={p.min} 
                    max={p.max} 
                    step={p.step}
                    value={currentValue}
                    onChange={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        updateProp("threed", p.key, val as never);
                    }}
                />
            </div>
        </div>;
    };
}
