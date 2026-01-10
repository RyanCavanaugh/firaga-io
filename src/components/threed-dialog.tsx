import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3D, ThreeDSettings } from '../threed-generator';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={exportFile}>Export 3D</button>
        </div>
    </div>;

    function exportFile(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ""));
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
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing one monochrome image per color and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberGroup(() => ({
    title: "Dimensions",
    fields: [
        {
            key: "pixelHeight" as const,
            label: "Pixel Height (mm)",
            min: 0.1,
            max: 10,
            step: 0.1,
        },
        {
            key: "baseHeight" as const,
            label: "Base Height (mm)",
            min: 0,
            max: 5,
            step: 0.1,
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

function makeNumberGroup(factory: () => {
    title: string;
    fields: ReadonlyArray<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
    }>;
}) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const config = factory();
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="print-setting-group-options">
                {config.fields.map(field => (
                    <label key={field.key}>
                        <span>{field.label}</span>
                        <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key]}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                updateProp("threed", field.key, value);
                            }}
                        />
                    </label>
                ))}
            </div>
        </div>;
    };
}
