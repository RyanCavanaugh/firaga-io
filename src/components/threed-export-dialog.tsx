import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <ParametersGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings = {
                format: props.settings.format,
                pixelHeight: props.settings.pixelHeight,
                baseThickness: props.settings.baseThickness
            };

            window.clarity?.("event", "3d-export", settings.format);

            let blob: Blob;
            let filename: string;

            if (settings.format === "3mf") {
                blob = await generate3MF(props.image, settings);
                filename = `${props.filename.replace(".png", "")}.3mf`;
            } else {
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = `${props.filename.replace(".png", "")}_openscad.zip`;
            }

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            updateProp("ui", "is3DExportOpen", false);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDExportDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDExportDialogProps = {
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
            description: "Industry-standard 3D Manufacturing Format with separate colored shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images per color and an OpenSCAD file that combines them using heightmaps.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const ParametersGroup = (props: ThreeDExportDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Parameters</h1>
        <div class="print-setting-group-options parameters-group">
            <label>
                <span>Pixel Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(value)) {
                            updateProp("threed", "pixelHeight", value);
                        }
                    }}
                />
            </label>
            <label>
                <span>Base Thickness (mm):</span>
                <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1"
                    value={props.settings.baseThickness}
                    onChange={(e) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(value)) {
                            updateProp("threed", "baseThickness", value);
                        }
                    }}
                />
            </label>
        </div>
        <span class="description">
            Pixel Height: The height of each colored pixel in the 3D model.<br/>
            Base Thickness: The thickness of the base layer beneath the pixels.
        </span>
    </div>;
};

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDExportDialogProps) {
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
