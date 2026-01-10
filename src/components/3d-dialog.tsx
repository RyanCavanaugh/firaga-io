import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threed"];
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <ThicknessGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            thickness: props.settings.thickness,
            pitch: getPitch(props.gridSize),
            filename: props.filename.replace(".png", ""),
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

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate material shapes for each color. Compatible with most 3D slicers.",
            icon: <span class="format-3mf">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white masks per color and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="format-openscad">🖼️</span>,
        },
    ]
}));

const ThicknessGroup = makeRadioGroup(() => ({
    key: "thickness",
    title: "Thickness (mm)",
    values: [
        {
            title: "2mm",
            value: 2,
            description: "Thin - good for small models",
            icon: <span class="thickness-icon">▁</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Medium - balanced thickness",
            icon: <span class="thickness-icon">▄</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Thick - sturdy and substantial",
            icon: <span class="thickness-icon">█</span>
        },
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
