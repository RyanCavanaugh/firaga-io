import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PitchGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pitch: props.settings.pitch,
            height: props.settings.height,
            filename: props.filename.replace(".png", ""),
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
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
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({}) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D slicers.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white images per color and an OpenSCAD file to combine them into a 3D model.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const PitchGroup = makeRadioGroup(({ gridSize }) => ({
    key: "pitch",
    title: "Voxel Size (Pitch)",
    values: [
        {
            title: "Material Default",
            value: getPitch(gridSize),
            description: `Use the default pitch for ${gridSize} (${getPitch(gridSize)}mm)`,
            icon: <span class="pitch-icon">📏</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "1mm per pixel",
            icon: <span class="pitch-icon">1</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm per pixel",
            icon: <span class="pitch-icon">2</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm per pixel",
            icon: <span class="pitch-icon">5</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "10mm per pixel",
            icon: <span class="pitch-icon">10</span>
        },
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Voxel Height",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "1mm height (thin)",
            icon: <span class="height-icon">━</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm height",
            icon: <span class="height-icon">▬</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm height (medium)",
            icon: <span class="height-icon">▬▬</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "10mm height (thick)",
            icon: <span class="height-icon">█</span>
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
