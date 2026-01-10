import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export type ThreeDProps = {
    format: ThreeDFormat;
    pixelHeight: number;
    pixelSize: number;
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
            pixelSize: props.settings.pixelSize,
            filename: props.filename.replace(".png", "")
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

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - industry standard triangle mesh with separate materials per color. Compatible with most 3D slicers.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images and OpenSCAD script. Allows customization of the 3D model.",
            icon: <span class="format-icon">🖼️</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions",
    fields: [
        {
            key: "pixelSize",
            label: "Pixel Size (mm)",
            min: 0.1,
            max: 100,
            step: 0.1,
            description: "Size of each pixel in millimeters"
        },
        {
            key: "pixelHeight",
            label: "Pixel Height (mm)",
            min: 0.1,
            max: 50,
            step: 0.1,
            description: "Height/thickness of each pixel layer in millimeters"
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

function makeNumberInputGroup(factory: () => {
    title: string | JSX.Element;
    fields: ReadonlyArray<{
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
            <div class="print-setting-group-options">
                {p.fields.map(field => (
                    <div class="number-input-field" key={field.key}>
                        <label>
                            <span>{field.label}</span>
                            <input
                                type="number"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={props.settings[field.key] as number}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    updateProp("threeD", field.key, value);
                                }}
                            />
                        </label>
                        <span class="description">{field.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
