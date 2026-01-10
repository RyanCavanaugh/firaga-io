import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
};

export type ThreeDProps = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight
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
            value: "3mf" as const,
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images (one per color) and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions (mm)",
    inputs: [
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 10,
            step: 0.1,
            description: "Height of each colored pixel in millimeters"
        },
        {
            key: "baseHeight",
            label: "Base Height",
            min: 0,
            max: 10,
            step: 0.1,
            description: "Height of the base plate in millimeters (3MF only)"
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
                            updateProp("threeDExport", p.key, v.value);
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

function makeNumberInputGroup(factory: () => {
    title: string | JSX.Element;
    inputs: ReadonlyArray<{
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
                {p.inputs.map(input => (
                    <div class="number-input-row">
                        <label>{input.label}</label>
                        <input
                            type="number"
                            min={input.min}
                            max={input.max}
                            step={input.step}
                            value={props.settings[input.key] as number}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                updateProp("threeDExport", input.key, value);
                            }}
                        />
                        <span class="input-description">{input.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
