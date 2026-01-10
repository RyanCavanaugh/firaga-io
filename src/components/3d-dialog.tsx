import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3mf-generator';
import { generateOpenSCAD, OpenSCADSettings } from '../openscad-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
            <PixelSizeGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" disabled={isExporting} onClick={() => export3D()}>
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function export3D() {
        setIsExporting(true);
        try {
            if (props.settings.format === "3mf") {
                const settings: ThreeDSettings = {
                    format: "3mf",
                    height: props.settings.height,
                    pixelSize: props.settings.pixelSize,
                    filename: props.filename.replace(".png", "")
                };
                await generate3MF(props.image, settings);
            } else {
                const settings: OpenSCADSettings = {
                    height: props.settings.height,
                    pixelSize: props.settings.pixelSize,
                    filename: props.filename.replace(".png", "")
                };
                await generateOpenSCAD(props.image, settings);
            }
            window.clarity?.("event", "export-3d", props.settings.format);
        } catch (error) {
            console.error("Error exporting 3D:", error);
            alert("Error exporting 3D file. Please try again.");
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
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "ZIP file containing monochrome masks and OpenSCAD file. Allows programmatic 3D model generation.",
            icon: <span class="format-icon">🔧</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Height (mm)",
    values: [
        {
            title: "2mm",
            value: 2,
            description: "Thin extrusion",
            icon: <span class="height-icon">▂</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Medium extrusion",
            icon: <span class="height-icon">▄</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Tall extrusion",
            icon: <span class="height-icon">█</span>
        },
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    key: "pixelSize",
    title: "Pixel Size (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Very small pixels, high detail",
            icon: <span class="size-icon">⚫</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Medium pixels",
            icon: <span class="size-icon">⬤</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Large pixels",
            icon: <span class="size-icon">🔵</span>
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
