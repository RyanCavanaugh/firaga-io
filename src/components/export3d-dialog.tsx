import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-export';
import { AppProps, Export3DProps } from '../types';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
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
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function exportModel() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            height: props.settings.height,
            pixelSize: props.settings.pixelSize
        };

        setIsExporting(true);
        try {
            window.clarity?.("event", "export-3d");
            await export3D(props.image, settings);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed: " + err);
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
}

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - industry standard triangle mesh with per-color materials. Compatible with most 3D printing slicers.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images per color and an OpenSCAD file using heightmap functionality to create layered 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const ParametersGroup = (props: Export3DDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>3D Parameters</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Size (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="100" 
                    step="0.1"
                    value={props.settings.pixelSize}
                    onChange={(e: any) => updateProp("export3d", "pixelSize", parseFloat(e.target.value) || 1)}
                />
            </label>
            <label>
                <span>Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="100" 
                    step="0.1"
                    value={props.settings.height}
                    onChange={(e: any) => updateProp("export3d", "height", parseFloat(e.target.value) || 1)}
                />
            </label>
        </div>
        <span class="description">
            Each pixel will be {props.settings.pixelSize}mm × {props.settings.pixelSize}mm × {props.settings.height}mm
        </span>
    </div>;
};

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
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
