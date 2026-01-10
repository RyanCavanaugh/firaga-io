import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

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
            baseHeight: props.settings.baseHeight,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(".png", ""));
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDExport"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDExport"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(({}: ThreeDDialogProps) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as ThreeDFormat,
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad" as ThreeDFormat,
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome images (one per color) and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions",
    key: "dimensions",
    values: [
        {
            key: "pixelHeight" as const,
            label: "Pixel Height (mm)",
            description: "Height of each colored pixel in millimeters",
            min: 0.1,
            max: 100,
            step: 0.1,
            default: 2
        },
        {
            key: "baseHeight" as const,
            label: "Base Height (mm)",
            description: "Height of the base layer in millimeters",
            min: 0,
            max: 100,
            step: 0.1,
            default: 1
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

type NumberInputGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: string;
    values: ReadonlyArray<{
        key: keyof ThreeDProps;
        label: string;
        description: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>;
};

function makeNumberInputGroup(factory: NumberInputGroupFactory) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options dimensions-group">
                {p.values.map(v => (
                    <div class="dimension-input">
                        <label>
                            {v.label}
                            <input 
                                type="number" 
                                min={v.min} 
                                max={v.max} 
                                step={v.step}
                                value={props.settings[v.key] as number}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(value)) {
                                        updateProp("threeDExport", v.key, value);
                                    }
                                }}
                            />
                        </label>
                        <span class="description">{v.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
