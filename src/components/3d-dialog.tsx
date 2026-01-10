import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <ThicknessGroup {...props} />
            <PixelSizeGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            thickness: props.settings.thickness,
            pixelSize: props.settings.pixelSize,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "3d-export");
        generate3D(props.image, settings);
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
            description: "3D Manufacturing Format with separate colored meshes. Compatible with most 3D printers and slicers.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with black/white masks per color and OpenSCAD script using heightmap functionality.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const ThicknessGroup = makeRadioGroup(() => ({
    key: "thickness",
    title: "Thickness (mm)",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Very thin, suitable for small models",
            icon: <span class="thickness-icon">│</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Standard thickness",
            icon: <span class="thickness-icon">┃</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Thick, more robust",
            icon: <span class="thickness-icon">█</span>
        }
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    key: "pixelSize",
    title: "Pixel Size (mm)",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "Tiny pixels for detailed models",
            icon: <span class="size-icon">·</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "Standard pixel size",
            icon: <span class="size-icon">•</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Large pixels for bigger models",
            icon: <span class="size-icon">●</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
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
