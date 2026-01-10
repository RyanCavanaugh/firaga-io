import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generators';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightSettingsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            heightPerLayer: props.settings.heightPerLayer,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
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

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Industry-standard 3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D slicing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome mask images and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🗜️</span>,
        }
    ]
}));

const HeightSettingsGroup = makeSliderGroup(() => ({
    title: "Height Settings",
    key: "heightPerLayer",
    settings: [
        {
            key: "heightPerLayer" as const,
            label: "Layer Height (mm)",
            min: 0.1,
            max: 10,
            step: 0.1
        },
        {
            key: "baseHeight" as const,
            label: "Base Height (mm)",
            min: 0,
            max: 10,
            step: 0.1
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

function makeSliderGroup(factory: () => {
    title: string | JSX.Element;
    key: string;
    settings: ReadonlyArray<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory();
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.settings.map(setting => (
                    <div class="slider-setting" key={setting.key}>
                        <label>{setting.label}</label>
                        <input
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={props.settings[setting.key] as number}
                            onChange={(e: any) => {
                                updateProp("threeDExport", setting.key, parseFloat(e.target.value));
                            }}
                        />
                        <span class="slider-value">{(props.settings[setting.key] as number).toFixed(1)}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
