import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
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
            height: props.settings.height,
            baseHeight: props.settings.baseHeight,
            pixelSize: props.settings.pixelSize
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
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
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format with separate colored shapes. Compatible with most 3D printing software.",
            icon: <span class="format-3mf">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white heightmap images and OpenSCAD file for combining them.",
            icon: <span class="format-openscad">🎭</span>,
        }
    ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimensions-inputs">
            <label>
                <span>Pixel Size:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.pixelSize}
                    onChange={(e) => updateProp("threeD", "pixelSize", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.height}
                    onChange={(e) => updateProp("threeD", "height", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number" 
                    min="0" 
                    step="0.1"
                    value={props.settings.baseHeight}
                    onChange={(e) => updateProp("threeD", "baseHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel size: {props.settings.pixelSize}mm, 
            Height: {props.settings.height}mm, 
            Base: {props.settings.baseHeight}mm
        </span>
    </div>;
};

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
