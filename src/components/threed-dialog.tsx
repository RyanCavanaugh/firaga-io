import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDExportSettings } from '../3d-export';
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
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel(): void {
        const settings: ThreeDExportSettings = {
            format: props.settings.format,
            pixelWidth: props.settings.pixelWidth,
            pixelHeight: props.settings.pixelHeight,
            baseThickness: props.settings.baseThickness,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, '')
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings).catch((error) => {
            console.error('3D export failed:', error);
            alert('Failed to export 3D model. See console for details.');
        });
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
            description: "3D Manufacturing Format - triangle mesh with separate materials per color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📦</span>
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with mask images and OpenSCAD script. Generate customizable 3D models in OpenSCAD.",
            icon: <span class="format-icon">🎭</span>
        }
    ]
}));

const DimensionsGroup = makeNumericGroup((): {
    title: string | JSX.Element;
    values: ReadonlyArray<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        unit: string;
    }>;
} => ({
    title: "Dimensions",
    values: [
        {
            key: "pixelWidth",
            label: "Pixel Width",
            min: 0.1,
            max: 50,
            step: 0.1,
            unit: "mm"
        },
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 50,
            step: 0.1,
            unit: "mm"
        },
        {
            key: "baseThickness",
            label: "Thickness",
            min: 0.1,
            max: 20,
            step: 0.1,
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
                {p.values.map(v => <label key={String(v.value)}>
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
            <span class="description">{p.values.find(v => v.value === props.settings[p.key])?.description}</span>
        </div>;
    };
}

function makeNumericGroup(factory: () => {
    title: string | JSX.Element;
    values: ReadonlyArray<{
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
        const p = factory();
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="numeric-inputs">
                {p.values.map(v => (
                    <label key={v.key}>
                        <span>{v.label}:</span>
                        <input
                            type="number"
                            min={v.min}
                            max={v.max}
                            step={v.step}
                            value={props.settings[v.key]}
                            onChange={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(val)) {
                                    updateProp("threed", v.key, val as never);
                                }
                            }}
                        />
                        <span>{v.unit}</span>
                    </label>
                ))}
            </div>
        </div>;
    };
}
