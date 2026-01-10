import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threed"];
    filename: string;
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
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
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

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format - triangle mesh with separate materials for each color. Compatible with most 3D software and slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome images per color and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions (mm)",
    fields: [
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 100,
            step: 0.1,
        },
        {
            key: "baseHeight",
            label: "Base Height",
            min: 0,
            max: 100,
            step: 0.1,
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threed"]>(factory: OptionGroupFactory<K>) {
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

type NumberInputGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    fields: ReadonlyArray<{
        key: keyof AppProps["threed"];
        label: string;
        min: number;
        max: number;
        step: number;
    }>;
}

function makeNumberInputGroup(factory: NumberInputGroupFactory) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="dimension-inputs">
                {p.fields.map(field => (
                    <div class="dimension-field">
                        <label>{field.label}</label>
                        <input 
                            type="number" 
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key] as number}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                updateProp("threed", field.key, value as any);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>;
    };
}
