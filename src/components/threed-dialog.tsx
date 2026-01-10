import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../threed-3mf';
import { generateOpenSCADMasks } from '../threed-openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function exportFile() {
        setIsGenerating(true);
        try {
            window.clarity?.("event", "export-3d");
            if (props.settings.format === "3mf") {
                await generate3MF(props.image, props.filename);
            } else {
                await generateOpenSCADMasks(props.image, props.filename);
            }
        } finally {
            setIsGenerating(false);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white masks per color and an OpenSCAD file to combine them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
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
