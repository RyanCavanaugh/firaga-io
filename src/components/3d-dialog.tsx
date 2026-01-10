import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

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
                disabled={isGenerating}
                onClick={() => generateFile()}>
                {isGenerating ? 'Generating...' : 'Export 3D'}
            </button>
        </div>
    </div>;
    
    async function generateFile(): Promise<void> {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings = {
                format: props.settings.format,
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ''),
                pixelHeight: props.settings.pixelHeight,
                baseHeight: props.settings.baseHeight
            };
            
            window.clarity?.("event", "3d-export");
            await generate3D(props.image, settings);
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

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with black/white images per color and an OpenSCAD file using heightmap functionality.",
            icon: <span class="format-icon">📦</span>
        }
    ]
}));

const PixelHeightGroup = makeNumberGroup(() => ({
    title: "Pixel Height",
    key: "pixelHeight",
    description: "Height of each pixel block in millimeters",
    min: 0.5,
    max: 10,
    step: 0.5
}));

const BaseHeightGroup = makeNumberGroup(() => ({
    title: "Base Height",
    key: "baseHeight",
    description: "Height of the base layer in millimeters",
    min: 0.5,
    max: 5,
    step: 0.5
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

function makeNumberGroup<K extends keyof ThreeDProps>(
    factory: (props: ThreeDDialogProps) => {
        title: string | JSX.Element;
        key: K;
        description: string | JSX.Element;
        min: number;
        max: number;
        step: number;
    }
) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="number-input-group">
                <input 
                    type="number"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={props.settings[p.key] as number}
                    onChange={(e) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(value)) {
                            updateProp("threeD", p.key, value as AppProps["threeD"][K]);
                        }
                    }}
                />
                <span class="unit">mm</span>
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
