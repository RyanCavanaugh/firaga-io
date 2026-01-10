import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export interface ThreeDProps {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
}

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => performExport()}>Export 3D</button>
        </div>
    </div>;

    function performExport(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
            filename: props.filename.replace(/\.(png|jpe?g|gif|bmp)$/i, ""),
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
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
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with materials. Compatible with most 3D modeling software and slicers.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "OpenSCAD masks - a zip file with black/white images per color and a .scad file for heightmap rendering.",
            icon: <span class="format-icon">🎨</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions (mm)",
    inputs: [
        {
            key: "pixelHeight" as const,
            label: "Pixel Height",
            description: "Height of each colored pixel in millimeters",
            min: 0.1,
            max: 50,
            step: 0.1,
        },
        {
            key: "baseHeight" as const,
            label: "Base Height",
            description: "Height of the base layer in millimeters",
            min: 0,
            max: 50,
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

type NumberInputConfig = {
    key: keyof ThreeDProps;
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
};

function makeNumberInputGroup(factory: () => {
    title: string | JSX.Element;
    inputs: ReadonlyArray<NumberInputConfig>;
}) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const config = factory();
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="print-setting-group-options">
                {config.inputs.map(input => (
                    <div key={input.key} class="number-input-row">
                        <label>
                            {input.label}:
                            <input
                                type="number"
                                min={input.min}
                                max={input.max}
                                step={input.step}
                                value={props.settings[input.key]}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    updateProp("threed", input.key, value);
                                }}
                            />
                        </label>
                        <span class="input-description">{input.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
