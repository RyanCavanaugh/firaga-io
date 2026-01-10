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
            <BaseHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            height: props.settings.height,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(".png", ""));
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDModel"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDModel"][K];
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
            description: "3D Manufacturing Format - a triangle mesh with separate material shapes for each color. Compatible with most 3D modeling software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome images for each color and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeSliderGroup(() => ({
    title: "Pixel Height (mm)",
    key: "height",
    min: 0.5,
    max: 10,
    step: 0.5,
    description: "Height of each colored pixel in millimeters"
}));

const BaseHeightGroup = makeSliderGroup(() => ({
    title: "Base Height (mm)",
    key: "baseHeight",
    min: 0,
    max: 5,
    step: 0.5,
    description: "Height of the base layer in millimeters"
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
                            updateProp("threeDModel", p.key, v.value);
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

type SliderGroupFactory<K extends keyof AppProps["threeDModel"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    min: number;
    max: number;
    step: number;
    description: string | JSX.Element;
}

function makeSliderGroup<K extends keyof ThreeDProps>(factory: SliderGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="slider-caption">
                <input 
                    type="range" 
                    class="slider" 
                    min={p.min} 
                    max={p.max} 
                    step={p.step} 
                    value={props.settings[p.key] as number}
                    onChange={(e: any) => updateProp("threeDModel", p.key, parseFloat(e.target.value))} />
                <span>{props.settings[p.key]} mm</span>
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
