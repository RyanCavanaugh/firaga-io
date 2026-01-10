import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../threed-generator';
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
            <button class="print" onClick={() => download3D()}>Download 3D</button>
        </div>
    </div>;

    function download3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "3d-export");
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
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - a triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD",
            description: "Zip file with color mask images and an OpenSCAD script that creates a 3D heightmap model.",
            icon: <span class="format-icon">🎨</span>,
        }
    ]
}));

const DimensionsGroup = makeSliderGroup(() => ({
    title: "Dimensions (mm)",
    key: "dimensions",
    values: [
        {
            key: "pixelHeight",
            title: "Pixel Height",
            description: "Height of each colored pixel",
            min: 0.5,
            max: 10,
            step: 0.5,
            default: 2
        },
        {
            key: "baseHeight",
            title: "Base Height",
            description: "Height of the base layer below pixels",
            min: 0,
            max: 10,
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

type SliderGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: string;
    values: ReadonlyArray<{
        key: keyof ThreeDProps;
        title: string;
        description: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>;
}

function makeSliderGroup(factory: SliderGroupFactory) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-sliders">
                {p.values.map(v => <div class="slider-row">
                    <label>{v.title}</label>
                    <input 
                        type="range" 
                        min={v.min} 
                        max={v.max} 
                        step={v.step}
                        value={props.settings[v.key] as number}
                        onChange={(e) => {
                            updateProp("threed", v.key, parseFloat((e.target as HTMLInputElement).value));
                        }} />
                    <span class="slider-value">{props.settings[v.key]} mm</span>
                    <span class="slider-description">{v.description}</span>
                </div>)}
            </div>
        </div>;
    };
}
