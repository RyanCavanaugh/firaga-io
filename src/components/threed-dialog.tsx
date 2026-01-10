import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelSizeGroup {...props} />
            <LayerHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelSize: props.settings.pixelSize,
            layerHeight: props.settings.layerHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ""));
    }
}

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
            description: "Standard 3D Manufacturing Format with separate material shapes for each color",
            icon: <span class="threed-icon">🧊</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome masks and OpenSCAD script for heightmap visualization",
            icon: <span class="threed-icon">📦</span>,
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
            description: "1mm per pixel",
            icon: <span>1</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm per pixel",
            icon: <span>2</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm per pixel (default)",
            icon: <span>5</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "10mm per pixel",
            icon: <span>10</span>
        }
    ]
}));

const LayerHeightGroup = makeRadioGroup(() => ({
    key: "layerHeight",
    title: "Layer Height (mm)",
    values: [
        {
            title: "0.2mm",
            value: 0.2,
            description: "Standard 3D printer layer height",
            icon: <span>0.2</span>
        },
        {
            title: "0.5mm",
            value: 0.5,
            description: "Thicker layers",
            icon: <span>0.5</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "1mm per color layer (default)",
            icon: <span>1</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm per color layer",
            icon: <span>2</span>
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
