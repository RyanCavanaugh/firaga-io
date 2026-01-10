import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export type ThreeDProps = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseHeight: number;
};

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
                onClick={handleGenerate}
                disabled={isGenerating}
            >
                {isGenerating ? 'Generating...' : 'Generate 3D'}
            </button>
        </div>
    </div>;
    
    async function handleGenerate(): Promise<void> {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings = {
                format: props.settings.format,
                pixelHeight: props.settings.pixelHeight,
                baseHeight: props.settings.baseHeight,
                filename: props.filename.replace(".png", ""),
            };
            
            window.clarity?.("event", "generate-3d");
            await generate3D(props.image, settings);
        } finally {
            setIsGenerating(false);
        }
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Output Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate colored shapes for each color. Compatible with most 3D software.",
            icon: <span class="format-3mf">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome images for each color and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-openscad">📦</span>,
        },
    ]
}));

const DimensionsGroup = makeNumberInputGroup(() => ({
    title: "Dimensions (mm)",
    inputs: [
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 100,
            step: 0.1,
            description: "Height of each colored pixel above the base"
        },
        {
            key: "baseHeight",
            label: "Base Height",
            min: 0,
            max: 100,
            step: 0.1,
            description: "Height of the base layer"
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
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}

type NumberInputGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    inputs: ReadonlyArray<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        description: string;
    }>;
};

function makeNumberInputGroup(factory: NumberInputGroupFactory) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.inputs.map(input => {
                    const value = props.settings[input.key] as number;
                    return <div key={input.key} class="number-input-container">
                        <label>
                            {input.label}:
                            <input 
                                type="number"
                                min={input.min}
                                max={input.max}
                                step={input.step}
                                value={value}
                                onChange={(e) => {
                                    const newValue = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(newValue)) {
                                        updateProp("threed", input.key, newValue);
                                    }
                                }}
                            />
                        </label>
                        <span class="input-description">{input.description}</span>
                    </div>;
                })}
            </div>
        </div>;
    };
}
