import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3d-generator-3mf';
import { generateOpenSCADMasks, OpenSCADSettings } from '../3d-generator-openscad';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => exportModel()} 
                disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings = {
                pitch: getPitch(props.gridSize),
                height: props.settings.height,
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            };

            window.clarity?.("event", "export-3d");

            if (props.settings.format === "3mf") {
                await generate3MF(props.image, settings as ThreeDSettings);
            } else {
                await generateOpenSCADMasks(props.image, settings as OpenSCADSettings);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDExport"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDExport"][K];
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

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Industry standard 3D Manufacturing Format with separate colored meshes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with mask images and OpenSCAD script. Provides full control over the 3D model generation.",
            icon: <span class="format-icon">🖼️</span>,
        },
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Bead Height",
    values: [
        {
            title: "2.5mm",
            value: 2.5,
            description: "Thin profile for mini beads",
            icon: <span class="height-icon">━</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Standard height for regular beads",
            icon: <span class="height-icon">═</span>
        },
        {
            title: "7.5mm",
            value: 7.5,
            description: "Tall profile for extra depth",
            icon: <span class="height-icon">▓</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Very tall for dramatic effect",
            icon: <span class="height-icon">█</span>
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
                            updateProp("threeDExport", p.key, v.value);
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
