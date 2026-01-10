import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelSizeGroup {...props} />
            <DepthGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            depth: props.settings.depth,
            pixelSize: props.settings.pixelSize
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
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
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-3mf">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome images and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-openscad">🎨</span>,
        }
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    key: "pixelSize",
    title: "Pixel Size (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Very small pixels (1mm × 1mm)",
            icon: <span class="size-small">⬝</span>
        },
        {
            title: "2.5mm",
            value: 2.5,
            description: "Small pixels (2.5mm × 2.5mm, mini beads)",
            icon: <span class="size-mini">⬞</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Standard pixels (5mm × 5mm, standard beads)",
            icon: <span class="size-standard">⬟</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Large pixels (10mm × 10mm)",
            icon: <span class="size-large">⬢</span>
        }
    ]
}));

const DepthGroup = makeRadioGroup(() => ({
    key: "depth",
    title: "Depth (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Very shallow depth",
            icon: <span class="depth-1">▁</span>
        },
        {
            title: "2.5mm",
            value: 2.5,
            description: "Shallow depth (typical bead height)",
            icon: <span class="depth-2">▂</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Medium depth",
            icon: <span class="depth-5">▄</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Deep",
            icon: <span class="depth-10">█</span>
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
