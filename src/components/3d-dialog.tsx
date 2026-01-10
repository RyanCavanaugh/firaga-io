import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, Generate3MFSettings } from '../3mf-generator';
import { generateOpenSCADMasks, GenerateOpenSCADSettings } from '../openscad-generator';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
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
                onClick={() => generate3D()}
                disabled={isGenerating}
            >
                {isGenerating ? "Generating..." : "Export 3D"}
            </button>
        </div>
    </div>;
    
    async function generate3D(): Promise<void> {
        setIsGenerating(true);
        
        try {
            const baseSettings = {
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
                pixelHeight: props.settings.pixelHeight,
                baseHeight: props.settings.baseHeight,
            };
            
            if (props.settings.format === "3mf") {
                generate3MF(props.image, baseSettings as Generate3MFSettings);
            } else {
                await generateOpenSCADMasks(props.image, baseSettings as GenerateOpenSCADSettings);
            }
            
            window.clarity?.("event", "export-3d", props.settings.format);
        } catch (error) {
            console.error("Failed to generate 3D file:", error);
            alert("Failed to generate 3D file. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup((_props) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D slicers and printers.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images per color and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">📁</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup((props) => ({
    title: "Dimensions (mm)",
    inputs: [
        {
            key: "pixelHeight",
            label: "Pixel Height",
            value: props.settings.pixelHeight,
            min: 0.1,
            max: 10,
            step: 0.1,
        },
        {
            key: "baseHeight",
            label: "Base Height",
            value: props.settings.baseHeight,
            min: 0,
            max: 10,
            step: 0.1,
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

function makeNumberInputGroup(factory: (props: ThreeDDialogProps) => {
    title: string;
    inputs: Array<{
        key: keyof ThreeDProps;
        label: string;
        value: number;
        min: number;
        max: number;
        step: number;
    }>;
}) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const config = factory(props);
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="number-inputs">
                {config.inputs.map(input => (
                    <label key={input.key}>
                        <span>{input.label}:</span>
                        <input
                            type="number"
                            value={input.value}
                            min={input.min}
                            max={input.max}
                            step={input.step}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(value)) {
                                    updateProp("threeD", input.key, value);
                                }
                            }}
                        />
                    </label>
                ))}
            </div>
        </div>;
    };
}
