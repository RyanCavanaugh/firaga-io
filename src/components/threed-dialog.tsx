import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, ThreeDSettings } from '../3d-generator-3mf';
import { generateOpenSCADMasks, OpenSCADSettings } from '../3d-generator-openscad';
import { saveAs } from 'file-saver';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <VoxelSizeGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => generate()} 
                disabled={isGenerating}
            >
                {isGenerating ? 'Generating...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function generate() {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings & OpenSCADSettings = {
                voxelSize: props.settings.voxelSize,
                height: props.settings.height,
            };

            window.clarity?.("event", "export-3d");

            if (props.settings.format === '3mf') {
                const blob = generate3MF(props.image, settings);
                saveAs(blob, `${props.filename.replace(/\.[^.]+$/, '')}.3mf`);
            } else {
                const blob = await generateOpenSCADMasks(props.image, settings);
                saveAs(blob, `${props.filename.replace(/\.[^.]+$/, '')}_openscad.zip`);
            }

            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Failed to generate 3D output:', error);
            alert('Failed to generate 3D output. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDSettings"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDSettings"][K];
        title: string | JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    readonly image: PartListImage;
    readonly settings: ThreeDProps;
    readonly filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing one black/white image per color and an OpenSCAD file that combines them into a 3D display using heightmap functionality.",
        },
    ]
}));

const VoxelSizeGroup = makeRadioGroup(() => ({
    key: "voxelSize",
    title: "Voxel Size (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Smallest size, highest detail",
        },
        {
            title: "2mm",
            value: 2,
            description: "Medium detail",
        },
        {
            title: "5mm",
            value: 5,
            description: "Larger size, lower detail",
        },
        {
            title: "10mm",
            value: 10,
            description: "Largest size, lowest detail",
        },
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Height (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Thin, flat model",
        },
        {
            title: "2mm",
            value: 2,
            description: "Standard height",
        },
        {
            title: "5mm",
            value: 5,
            description: "Thicker model",
        },
        {
            title: "10mm",
            value: 10,
            description: "Very thick model",
        },
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
                            updateProp("threeDSettings", p.key, v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}
