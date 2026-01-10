import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../threemf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Export 3D</button>
        </div>
    </div>;

    function generate3D() {
        const settings = {
            pixelWidth: props.settings.pixelWidth,
            pixelHeight: props.settings.pixelHeight,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, '')
        };

        window.clarity?.("event", "export-3d");
        
        if (props.settings.format === '3mf') {
            generate3MF(props.image, settings);
        } else {
            generateOpenSCADMasks(props.image, settings);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
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
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - industry standard triangle mesh with separate materials per color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images per color and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumericInputGroup(() => ({
    title: "Dimensions (mm)",
    fields: [
        {
            key: "pixelWidth",
            label: "Pixel Width",
            min: 0.1,
            max: 100,
            step: 0.1,
            defaultValue: 2.5
        },
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 100,
            step: 0.1,
            defaultValue: 2.5
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
                {p.values.map(v => <label key={String(v.value)}>
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

function makeNumericInputGroup<K extends keyof ThreeDProps>(
    factory: () => {
        title: string;
        fields: ReadonlyArray<{
            key: K;
            label: string;
            min: number;
            max: number;
            step: number;
            defaultValue: number;
        }>;
    }
) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory();
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="numeric-inputs">
                {p.fields.map(field => (
                    <div class="numeric-input-row" key={field.key as string}>
                        <label>{field.label}</label>
                        <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key] as number}
                            onChange={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(val)) {
                                    updateProp("threeD", field.key, val as any);
                                }
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>;
    };
}
