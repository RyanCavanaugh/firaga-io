import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3d-generator-3mf';
import { generateOpenSCADMasks } from '../3d-generator-openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export</button>
        </div>
    </div>;

    function exportModel() {
        window.clarity?.("event", "3d-export");
        
        if (props.settings.format === "3mf") {
            generate3MF(props.image, props.filename.replace(".png", ""));
        } else if (props.settings.format === "openscad") {
            generateOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        }
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
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threeDExport"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as 3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as a ZIP file containing monochrome masks (one per color) and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threeDExport"]>(factory: OptionGroupFactory<K>) {
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
