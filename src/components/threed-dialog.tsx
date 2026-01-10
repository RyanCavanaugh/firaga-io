import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
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
            <button 
                class="print" 
                onClick={() => exportModel()}
                disabled={isGenerating}
            >
                {isGenerating ? 'Generating...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings = {
                format: props.settings.format,
                filename: props.filename.replace(".png", ""),
                pixelHeight: props.settings.pixelHeight,
                baseThickness: props.settings.baseThickness,
            };

            window.clarity?.("event", "export-3d", settings.format);
            await generate3D(props.image, settings);
        } catch (error) {
            console.error("Error generating 3D model:", error);
            alert("Error generating 3D model. Please try again.");
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

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Triangle Mesh",
            description: "Industry-standard 3D Manufacturing Format with separate colored meshes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white heightmap images and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumericGroup(() => ({
    title: "Dimensions (mm)",
    values: [
        {
            key: "pixelHeight" as const,
            title: "Pixel Height",
            description: "Height of each pixel in millimeters",
            min: 0.1,
            max: 10,
            step: 0.1,
            default: 2
        },
        {
            key: "baseThickness" as const,
            title: "Base Thickness",
            description: "Thickness of the base plate in millimeters",
            min: 0.1,
            max: 10,
            step: 0.1,
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

function makeNumericGroup(factory: () => {
    title: string;
    values: ReadonlyArray<{
        key: keyof ThreeDProps;
        title: string;
        description: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory();
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="dimensions-inputs">
                {p.values.map(v => (
                    <div class="dimension-input">
                        <label>
                            <span class="dimension-label">{v.title}</span>
                            <input 
                                type="number"
                                min={v.min}
                                max={v.max}
                                step={v.step}
                                value={props.settings[v.key] as number}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(value)) {
                                        updateProp("threed", v.key, value);
                                    }
                                }}
                            />
                        </label>
                        <span class="dimension-description">{v.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
