import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
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
            pitch: getPitch(props.gridSize),
            gridSize: [props.gridSize === "artkal-mini" ? 29 : 
                       props.gridSize === "perler-mini" ? 29 : 
                       props.gridSize === "perler" ? 29 : 
                       props.gridSize === "evoretro" ? 29 :
                       props.gridSize === "funzbo" ? 29 :
                       props.gridSize === "16 ct" ? 29 :
                       props.gridSize === "30 ct" ? 29 : 29,
                       props.gridSize === "artkal-mini" ? 29 : 
                       props.gridSize === "perler-mini" ? 29 : 
                       props.gridSize === "perler" ? 29 : 
                       props.gridSize === "evoretro" ? 29 :
                       props.gridSize === "funzbo" ? 29 :
                       props.gridSize === "16 ct" ? 29 :
                       props.gridSize === "30 ct" ? 29 : 29],
            height: props.settings.height,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
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

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - industry standard triangle mesh with separate materials for each color. Compatible with most 3D slicers and printers.",
            icon: <span class="format-icon">🏗️</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images for each color and an OpenSCAD file that combines them into a 3D model using heightmaps.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "height",
    title: "Layer Height (mm)",
    values: [
        {
            title: "2mm",
            value: 2,
            description: "Thin layer - good for small models",
            icon: <span class="height-icon">─</span>
        },
        {
            title: "3mm",
            value: 3,
            description: "Medium layer - balanced",
            icon: <span class="height-icon">━</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Thick layer - more prominent",
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
