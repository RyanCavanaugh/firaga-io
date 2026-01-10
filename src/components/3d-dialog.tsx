import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, ThreeMFSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { saveAs } from 'file-saver';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelHeightGroup {...props} />
            <BaseHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings = props.settings;
            const pitch = props.pitch;
            
            if (settings.format === "3mf") {
                const threeMFSettings: ThreeMFSettings = {
                    pixelHeight: settings.pixelHeight,
                    baseHeight: settings.baseHeight,
                    pitch: pitch
                };
                
                window.clarity?.("event", "export-3mf");
                const blob = await generate3MF(props.image, threeMFSettings);
                saveAs(blob, `${props.filename}.3mf`);
            } else if (settings.format === "openscad") {
                const openscadSettings: OpenSCADSettings = {
                    pixelHeight: settings.pixelHeight,
                    pitch: pitch
                };
                
                window.clarity?.("event", "export-openscad");
                const blob = await generateOpenSCADMasks(props.image, openscadSettings);
                saveAs(blob, `${props.filename}_openscad.zip`);
            }
            
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error("Error exporting 3D model:", error);
            alert("Error exporting 3D model: " + error.message);
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
    pitch: number;
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Industry standard triangle mesh with separate colored shapes. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white mask images (one per color) and an OpenSCAD file that uses heightmap functionality to create a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const PixelHeightGroup = makeRadioGroup(() => ({
    key: "pixelHeight",
    title: "Pixel Height",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Thin, suitable for flat displays",
            icon: <span class="height-icon">▬</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Medium height",
            icon: <span class="height-icon">▭</span>
        },
        {
            title: "3mm",
            value: 3,
            description: "Standard height, good visibility",
            icon: <span class="height-icon">▮</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Tall, very visible",
            icon: <span class="height-icon">▯</span>
        }
    ]
}));

const BaseHeightGroup = makeRadioGroup(() => ({
    key: "baseHeight",
    title: "Base Height (3MF only)",
    values: [
        {
            title: "0mm",
            value: 0,
            description: "No base layer",
            icon: <span class="base-icon">⎯</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "Thin base",
            icon: <span class="base-icon">⎵</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Standard base",
            icon: <span class="base-icon">⎶</span>
        }
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
