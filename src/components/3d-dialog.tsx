import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
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
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            height: props.settings.height,
            baseHeight: props.settings.baseHeight
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

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as a 3MF triangle mesh with separate material shapes for each color. Compatible with most 3D software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as a ZIP file containing monochrome mask images and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeNumericGroup(() => ({
    title: "3D Settings",
    key: "height",
    values: [
        {
            label: "Layer Height (mm)",
            key: "height",
            min: 0.1,
            max: 10,
            step: 0.1,
            default: 1
        },
        {
            label: "Base Height (mm)",
            key: "baseHeight",
            min: 0,
            max: 20,
            step: 0.5,
            default: 0
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

function makeNumericGroup(factory: () => {
    title: string;
    key: string;
    values: Array<{
        label: string;
        key: keyof ThreeDProps;
        min: number;
        max: number;
        step: number;
        default: number;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory();
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(field => (
                    <div class="numeric-field">
                        <label>{field.label}</label>
                        <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key] as number}
                            onChange={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                updateProp("threeD", field.key, val);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>;
    };
}
