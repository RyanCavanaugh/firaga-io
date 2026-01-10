import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3dOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            height: props.settings.height,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    readonly title: string | JSX.Element;
    readonly key: K;
    readonly values: ReadonlyArray<{
        readonly value: AppProps["threeD"][K];
        readonly title: string | JSX.Element;
        readonly icon: JSX.Element;
        readonly description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    readonly image: PartListImage;
    readonly settings: ThreeDProps;
    readonly filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Mesh",
            description: "Triangle mesh with separate material colors. Standard 3D printing format.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD Masks",
            description: "Zip file with mask images and OpenSCAD file. Advanced customization.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeSliderGroup(() => ({
    title: "Height (mm)",
    key: "height",
    min: 1,
    max: 20,
    step: 0.5,
    description: "Height of the 3D model in millimeters"
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

function makeSliderGroup<K extends keyof ThreeDProps>(
    factory: (props: ThreeDDialogProps) => {
        readonly title: string;
        readonly key: K;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly description: string;
    }
) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="slider-container">
                <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={props.settings[p.key] as number}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        updateProp("threeD", p.key, parseFloat(target.value) as ThreeDProps[K]);
                    }}
                />
                <span class="slider-value">{props.settings[p.key]}</span>
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
