import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../threed-export';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threed"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function handleExport(): Promise<void> {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
            filename: props.filename.replace(".png", ""),
        };

        setIsExporting(true);
        window.clarity?.("event", "export-3d");
        
        try {
            await export3D(props.image, settings);
        } catch (error) {
            console.error("Failed to export 3D:", error);
            alert("Failed to export 3D model. Please try again.");
        } finally {
            setIsExporting(false);
        }
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
            description: "3D Manufacturing Format - compatible with most 3D printing software",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "ZIP file with heightmap masks and OpenSCAD file for customization",
            icon: <span class="format-icon">🔧</span>,
        },
    ]
}));

const DimensionsGroup = makeNumberInputGroup((): {
    title: string | JSX.Element;
    inputs: Array<{
        key: keyof AppProps["threed"];
        label: string;
        min: number;
        max: number;
        step: number;
        unit: string;
    }>;
} => ({
    title: "Dimensions",
    inputs: [
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 10,
            step: 0.1,
            unit: "mm"
        },
        {
            key: "baseHeight",
            label: "Base Height",
            min: 0,
            max: 10,
            step: 0.1,
            unit: "mm"
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threed"]>(factory: OptionGroupFactory<K>) {
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
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}

function makeNumberInputGroup(factory: () => {
    title: string | JSX.Element;
    inputs: Array<{
        key: keyof AppProps["threed"];
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
            <div class="print-setting-group-options dimensions-inputs">
                {config.inputs.map(input => (
                    <label key={input.key}>
                        <span class="input-label">{input.label}:</span>
                        <input
                            type="number"
                            min={input.min}
                            max={input.max}
                            step={input.step}
                            value={props.settings[input.key] as number}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(value)) {
                                    updateProp("threed", input.key, value);
                                }
                            }}
                        />
                        <span class="input-unit">{input.unit}</span>
                    </label>
                ))}
            </div>
        </div>;
    };
}
