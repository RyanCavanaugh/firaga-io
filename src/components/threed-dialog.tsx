import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../threed-generator';
import { AppProps } from '../types';
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
            heightPerLayer: props.settings.heightPerLayer,
            baseHeight: props.settings.baseHeight,
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

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDSettings["format"];
    heightPerLayer: number;
    baseHeight: number;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Triangle mesh with separate materials per color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file with mask images and OpenSCAD file for customizable 3D models.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberGroup(() => ({
    title: "Dimensions",
    key: "dimensions",
    values: [
        {
            key: "baseHeight",
            title: "Base Height (mm)",
            description: "Height of the base layer",
            min: 0,
            max: 10,
            step: 0.1,
        },
        {
            key: "heightPerLayer",
            title: "Height Per Layer (mm)",
            description: "Height for each color layer",
            min: 0.1,
            max: 10,
            step: 0.1,
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

function makeNumberGroup(factory: () => {
    title: string;
    key: string;
    values: ReadonlyArray<{
        key: keyof ThreeDProps;
        title: string;
        description: string;
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
                {p.values.map(v => <label>
                    <div class="option">
                        <h3>{v.title}</h3>
                        <input 
                            type="number"
                            min={v.min}
                            max={v.max}
                            step={v.step}
                            value={props.settings[v.key] as number}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                updateProp("threed", v.key, value);
                            }} 
                        />
                        <span class="description">{v.description}</span>
                    </div>
                </label>)}
            </div>
        </div>;
    };
}
