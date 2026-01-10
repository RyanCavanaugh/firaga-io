import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { Export3DSettings, generate3MF, generateOpenSCADMasks } from '../export-3d';
import { AppProps } from '../types';
import { PropContext } from './context';
import { saveAs } from 'file-saver';

export interface Export3DDialogProps {
    image: PartListImage;
    settings: AppProps["export3d"];
    filename: string;
}

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog export-3d-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => exportModel()}
                disabled={isExporting}
            >
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings: Export3DSettings = {
                format: props.settings.format,
                height: props.settings.height,
                baseThickness: props.settings.baseThickness
            };

            window.clarity?.("event", "export-3d", props.settings.format);

            let blob: Blob;
            let filename: string;

            if (settings.format === "3mf") {
                blob = await generate3MF(props.image, settings);
                filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "") + ".3mf";
            } else {
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "") + "_openscad.zip";
            }

            saveAs(blob, filename);
            updateProp("ui", "is3DExportOpen", false);
        } catch (error) {
            console.error("Error exporting 3D model:", error);
            alert("Failed to export 3D model. See console for details.");
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["export3d"]> = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["export3d"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Industry-standard 3D Manufacturing Format with triangle meshes and materials. Compatible with most 3D printers and slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome heightmap images and an OpenSCAD script. Allows for customization and parametric design.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    title: "Extrusion Height",
    key: "height",
    values: [
        {
            value: 2,
            title: "2mm",
            description: "Thin profile, good for flat displays",
            icon: <span class="height-icon">─</span>
        },
        {
            value: 5,
            title: "5mm",
            description: "Standard height, balanced appearance",
            icon: <span class="height-icon">▬</span>
        },
        {
            value: 10,
            title: "10mm",
            description: "Tall profile, prominent 3D effect",
            icon: <span class="height-icon">█</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["export3d"]>(factory: OptionGroupFactory<K>) {
    return function (props: Export3DDialogProps) {
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
                            updateProp("export3d", p.key, v.value);
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
