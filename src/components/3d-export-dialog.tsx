import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
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
            <button class="print" onClick={() => export3DModel()}>Export 3D</button>
        </div>
    </div>;

    function export3DModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, "")
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
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
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate shapes per color. Compatible with most 3D slicers and CAD software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "ZIP file containing black/white mask images per color and an OpenSCAD script that combines them using heightmap functionality.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeNumberGroup(() => ({
    title: "3D Settings",
    fields: [
        {
            key: "pixelHeight",
            label: "Pixel Height (mm)",
            min: 0.5,
            max: 10,
            step: 0.5,
            description: "Height of each colored pixel above the base"
        },
        {
            key: "baseHeight",
            label: "Base Height (mm)",
            min: 0.5,
            max: 10,
            step: 0.5,
            description: "Height of the base plate"
        }
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

function makeNumberGroup(factory: () => {
    title: string;
    fields: Array<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        description: string;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory();
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="number-inputs">
                {p.fields.map(field => (
                    <div class="number-input-group">
                        <label>{field.label}</label>
                        <input 
                            type="number" 
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key] as number}
                            onChange={(e) => {
                                updateProp("threed", field.key, parseFloat((e.target as HTMLInputElement).value));
                            }}
                        />
                        <span class="description">{field.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
