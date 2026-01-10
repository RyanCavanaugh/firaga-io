import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
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
            pitch: getPitch(props.gridSize),
            height: props.settings.height,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
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
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate material shapes for each color. Compatible with most 3D printers.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images and OpenSCAD file. Load in OpenSCAD for customization.",
            icon: <span class="format-icon">🗜️</span>,
        }
    ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    const pitch = getPitch(props.gridSize);
    
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="dimension-controls">
            <label>
                <span>Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.height}
                    onChange={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(val) && val > 0) {
                            updateProp("threed", "height", val);
                        }
                    }}
                />
            </label>
            <div class="dimension-info">
                Pixel size: {pitch.toFixed(2)}mm × {pitch.toFixed(2)}mm × {props.settings.height.toFixed(2)}mm
            </div>
        </div>
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
