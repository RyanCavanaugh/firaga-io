import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelHeightGroup {...props} />
            <BaseHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={handleGenerate}
                disabled={isGenerating}
            >
                {isGenerating ? "Generating..." : "Generate 3D"}
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
                gridSize: props.gridSize,
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            };

            window.clarity?.("event", "3d-export");
            await generate3D(props.image, settings);
        } finally {
            setIsGenerating(false);
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
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Industry-standard 3D manufacturing format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome images (one per color) and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="format-icon">🗜️</span>,
        },
    ]
}));

const PixelHeightGroup = makeSliderGroup((): ReturnType<SliderGroupFactory<"pixelHeight">> => ({
    title: "Pixel Height (mm)",
    key: "pixelHeight",
    min: 0.5,
    max: 10,
    step: 0.5,
    description: "Height of each colored pixel in the 3D model"
}));

const BaseHeightGroup = makeSliderGroup((): ReturnType<SliderGroupFactory<"baseHeight">> => ({
    title: "Base Height (mm)",
    key: "baseHeight",
    min: 0,
    max: 5,
    step: 0.5,
    description: "Height of the base layer beneath all pixels"
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

type SliderGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    min: number;
    max: number;
    step: number;
    description: string | JSX.Element;
};

function makeSliderGroup<K extends keyof ThreeDProps>(factory: SliderGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="slider-group">
                <input 
                    type="range" 
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={props.settings[p.key] as number}
                    onChange={(e) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        updateProp("threeD", p.key, value as never);
                    }}
                />
                <span class="slider-value">{props.settings[p.key]}</span>
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
