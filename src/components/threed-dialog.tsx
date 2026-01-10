import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        try {
            const pitch = getPitch(props.gridSize);
            const height = props.settings.height;
            const filename = props.filename.replace(".png", "");
            
            if (props.settings.format === "3mf") {
                const settings: Export3MFSettings = {
                    pitch,
                    height,
                    filename
                };
                export3MF(props.image, settings);
            } else {
                const settings: ExportOpenSCADSettings = {
                    pitch,
                    height,
                    filename
                };
                await exportOpenSCADMasks(props.image, settings);
            }
            
            window.clarity?.("event", "export-3d", props.settings.format);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
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
            description: "Triangle mesh with separate shapes per color. Compatible with most 3D printers and modeling software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images and OpenSCAD file using heightmap. Requires OpenSCAD to view.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInput(() => ({
    title: "Layer Height (mm)",
    key: "height",
    min: 0.1,
    max: 10,
    step: 0.1,
    description: "Height of each color layer in millimeters"
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

function makeNumberInput<K extends keyof ThreeDProps>(factory: (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    min: number;
    max: number;
    step: number;
    description: string | JSX.Element;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                <label>
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
                        style="width: 100px; padding: 5px; font-size: 16px;"
                    />
                </label>
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
