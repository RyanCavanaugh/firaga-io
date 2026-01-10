import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generateThreeMF, ThreeMFSettings } from '../threemf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" disabled={isGenerating} onClick={() => generate3D()}>
                {isGenerating ? 'Generating...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function generate3D() {
        setIsGenerating(true);
        try {
            const settings = {
                filename: props.filename.replace(".png", ""),
                layerHeight: props.settings.layerHeight,
                pixelSize: props.settings.pixelSize
            };

            window.clarity?.("event", "export-3d");

            if (props.settings.format === "3mf") {
                generateThreeMF(props.image, settings as ThreeMFSettings);
            } else if (props.settings.format === "openscad") {
                await generateOpenSCADMasks(props.image, settings as OpenSCADSettings);
            }
        } catch (error) {
            console.error("Error generating 3D file:", error);
            alert("Error generating 3D file. Please try again.");
        } finally {
            setIsGenerating(false);
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
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate colored shapes. Compatible with most 3D printers and CAD software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with mask images and OpenSCAD script. Allows customization in OpenSCAD before exporting.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions",
    fields: [
        {
            key: "pixelSize",
            label: "Pixel Size (mm)",
            min: 0.1,
            max: 100,
            step: 0.1,
            description: "Width and height of each pixel in millimeters"
        },
        {
            key: "layerHeight",
            label: "Layer Height (mm)",
            min: 0.1,
            max: 50,
            step: 0.1,
            description: "Thickness/depth of each color layer in millimeters"
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

function makeNumberInputGroup(factory: () => {
    title: string;
    fields: Array<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        description: string;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const config = factory();
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="print-setting-group-options dimensions-group">
                {config.fields.map(field => (
                    <div class="dimension-field">
                        <label>
                            <span class="dimension-label">{field.label}</span>
                            <input 
                                type="number" 
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={props.settings[field.key] as number}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(value)) {
                                        updateProp("threed", field.key, value as any);
                                    }
                                }}
                            />
                        </label>
                        <span class="description">{field.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
