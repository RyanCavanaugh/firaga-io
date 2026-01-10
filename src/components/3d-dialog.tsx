import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../3d-generator';
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
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
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
    settings: ThreeDProps;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate materials for each color",
            icon: <span class="format-3mf">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with mask images and OpenSCAD file using heightmap functionality",
            icon: <span class="format-openscad">🗂️</span>,
        }
    ]
}));

const HeightGroup = makeSliderGroup(() => ({
    title: "Height Settings",
    items: [
        {
            key: "pixelHeight",
            label: "Pixel Height (mm)",
            min: 0.5,
            max: 10,
            step: 0.5,
            default: 2
        },
        {
            key: "baseHeight",
            label: "Base Height (mm)",
            min: 0,
            max: 5,
            step: 0.5,
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

function makeSliderGroup(factory: () => {
    title: string;
    items: Array<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const config = factory();
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="options-group">
                {config.items.map(item => (
                    <div class="slider-container">
                        <label>{item.label}: {props.settings[item.key]}</label>
                        <input
                            type="range"
                            min={item.min}
                            max={item.max}
                            step={item.step}
                            value={props.settings[item.key] as number}
                            onInput={(e) => {
                                updateProp("threeDExport", item.key, parseFloat((e.target as HTMLInputElement).value));
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>;
    };
}
