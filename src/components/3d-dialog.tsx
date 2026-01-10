import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { ThreeDSettings } from '../3d-types';
import { generate3MF, download3MF } from '../3mf-generator';
import { generateOpenSCADMasks, downloadOpenSCADMasks } from '../openscad-generator';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: AppProps["threeDPrint"];
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
            <PixelSizeGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DPrintOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function generate3D(): Promise<void> {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings = {
                format: props.settings.format,
                height: props.settings.height,
                pixelSize: props.settings.pixelSize
            };

            window.clarity?.("event", "export-3d", props.settings.format);

            if (settings.format === "3mf") {
                const blob = generate3MF(props.image, settings);
                download3MF(blob, props.filename);
            } else if (settings.format === "openscad-masks") {
                const blob = await generateOpenSCADMasks(props.image, settings);
                downloadOpenSCADMasks(blob, props.filename);
            }
        } finally {
            setIsGenerating(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDPrint"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDPrint"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate colored shapes. Compatible with most 3D software and printers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white images per color and an OpenSCAD file using heightmap. Ideal for programmatic 3D modeling.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Extrusion Height",
    values: [
        {
            title: "2mm",
            value: 2,
            description: "Thin extrusion, good for flat displays",
            icon: <span class="height-icon">▬</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Medium height, balanced",
            icon: <span class="height-icon">▬▬</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Thick extrusion, more 3D presence",
            icon: <span class="height-icon">▬▬▬</span>
        }
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    key: "pixelSize",
    title: "Pixel Size",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Small pixels, compact model",
            icon: <span class="size-icon">⬝</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Standard pixel size",
            icon: <span class="size-icon">⬞</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Large pixels, bigger model",
            icon: <span class="size-icon">⬛</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threeDPrint"]>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threeDPrint", p.key, v.value);
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
