import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D Model</button>
        </div>
    </div>;

    function exportModel(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseThickness: props.settings.baseThickness,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
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
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "Industry standard 3D Manufacturing Format with separate material shapes for each color",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "ZIP file with heightmap images and OpenSCAD script for 3D display",
            icon: <span class="format-icon">🔧</span>,
        }
    ]
}));

const DimensionsGroup = makeSliderGroup((): {
    title: string | JSX.Element;
    sliders: Array<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        unit: string;
    }>;
} => ({
    title: "Dimensions",
    sliders: [
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.5,
            max: 10,
            step: 0.5,
            unit: "mm"
        },
        {
            key: "baseThickness",
            label: "Base Thickness",
            min: 0.5,
            max: 5,
            step: 0.5,
            unit: "mm"
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
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

function makeSliderGroup(factory: () => {
    title: string | JSX.Element;
    sliders: Array<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        unit: string;
    }>;
}) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const config = factory();
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="dimensions-sliders">
                {config.sliders.map(slider => (
                    <div class="slider-row" key={slider.key}>
                        <label>{slider.label}</label>
                        <div class="slider-control">
                            <input
                                type="range"
                                min={slider.min}
                                max={slider.max}
                                step={slider.step}
                                value={props.settings[slider.key]}
                                onChange={(e: any) => {
                                    updateProp("threed", slider.key, parseFloat(e.target.value));
                                }}
                            />
                            <span class="slider-value">{props.settings[slider.key]}{slider.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>;
    };
}
