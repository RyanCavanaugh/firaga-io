import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isGenerating, setIsGenerating] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelSizeGroup {...props} />
            <PixelHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => exportModel()} 
                disabled={isGenerating}
            >
                {isGenerating ? 'Generating...' : 'Export 3D Model'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings = {
                format: props.settings.format,
                pixelSize: props.settings.pixelSize,
                pixelHeight: props.settings.pixelHeight,
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ''),
            };

            window.clarity?.("event", "3d-export", settings.format);
            await generate3D(props.image, settings);
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
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Industry standard triangle mesh format with separate shapes per color. Compatible with most 3D modeling software.",
            icon: <span class="format-3mf">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "OpenSCAD heightmap format - Zip file with black/white masks per color and .scad file. Requires OpenSCAD to view/modify.",
            icon: <span class="format-openscad">🔧</span>,
        }
    ]
}));

const PixelSizeGroup = makeNumberInput(() => ({
    title: "Pixel Size (mm)",
    key: "pixelSize",
    description: "Width and depth of each pixel in millimeters",
    min: 0.1,
    max: 100,
    step: 0.1
}));

const PixelHeightGroup = makeNumberInput(() => ({
    title: "Pixel Height (mm)",
    key: "pixelHeight",
    description: "Height/thickness of each pixel layer in millimeters",
    min: 0.1,
    max: 100,
    step: 0.1
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

type NumberInputFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    description: string | JSX.Element;
    min: number;
    max: number;
    step: number;
}

function makeNumberInput<K extends keyof ThreeDProps>(factory: NumberInputFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                <input 
                    type="number" 
                    value={props.settings[p.key] as number}
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    onChange={(e) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(value)) {
                            updateProp("threed", p.key, value as any);
                        }
                    }}
                    style="width: 100px; padding: 5px; font-size: 16px;"
                />
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
