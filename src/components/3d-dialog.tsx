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
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => export3D()} 
                disabled={isGenerating}
            >
                {isGenerating ? "Generating..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            filename: props.filename.replace(".png", "")
        };

        setIsGenerating(true);
        try {
            window.clarity?.("event", "3d-export");
            await generate3D(props.image, settings);
        } catch (error) {
            console.error("3D export failed:", error);
            alert("3D export failed. Please check the console for details.");
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
        description: string | JSX.Element;
        icon: JSX.Element;
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
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D modeling software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images per color and an OpenSCAD file that creates a 3D display using heightmaps.",
            icon: <span class="format-icon">🎨</span>,
        }
    ]
}));

const HeightGroup = makeNumberInput(() => ({
    title: "Pixel Height (mm)",
    key: "pixelHeight",
    min: 0.1,
    max: 10,
    step: 0.1,
    description: "Height of each pixel in the 3D model"
}));

function NumberInputGroup(props: ThreeDDialogProps & {
    title: string;
    key: keyof ThreeDProps;
    min: number;
    max: number;
    step: number;
    description: string;
}) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>{props.title}</h1>
        <div class="print-setting-group-options">
            <input 
                type="number" 
                min={props.min}
                max={props.max}
                step={props.step}
                value={props.settings[props.key] as number}
                onChange={(e) => {
                    const value = parseFloat((e.target as HTMLInputElement).value);
                    updateProp("threed", props.key, value);
                }}
                style={{ width: "100px", padding: "8px", fontSize: "16px" }}
            />
        </div>
        <span class="description">{props.description}</span>
    </div>;
}

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

function makeNumberInput(factory: (props: ThreeDDialogProps) => {
    title: string;
    key: keyof ThreeDProps;
    min: number;
    max: number;
    step: number;
    description: string;
}) {
    return function (props: ThreeDDialogProps) {
        const p = factory(props);
        return <NumberInputGroup {...props} {...p} />;
    };
}
