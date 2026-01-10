import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { getGridSize, getPitch } from '../utils';
import { PropContext } from './context';
import { generate3MF } from '../threed-generator-3mf';
import { generateOpenSCADMasks } from '../threed-generator-openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <ThicknessGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings = {
            format: props.settings.format,
            thickness: props.settings.thickness,
            carveSize: getGridSize(props.gridSize),
            pitch: getPitch(props.gridSize),
            filename: props.filename.replace(".png", ""),
        };

        window.clarity?.("event", "3d-export");
        
        if (settings.format === "3mf") {
            generate3MF(props.image, settings);
        } else if (settings.format === "openscad") {
            generateOpenSCADMasks(props.image, settings);
        }
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
            title: "3MF Mesh",
            description: "Export as 3MF triangle mesh with separate materials for each color",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as ZIP with monochrome masks and OpenSCAD file for heightmap rendering",
            icon: <span class="format-icon">🗜️</span>,
        }
    ]
}));

const ThicknessGroup = makeRadioGroup(() => ({
    key: "thickness",
    title: "Thickness",
    values: [
        {
            title: "Thin",
            value: 1,
            description: "1mm thickness",
            icon: <span class="thickness-icon">│</span>
        },
        {
            title: "Medium",
            value: 2,
            description: "2mm thickness",
            icon: <span class="thickness-icon">║</span>
        },
        {
            title: "Thick",
            value: 3,
            description: "3mm thickness",
            icon: <span class="thickness-icon">█</span>
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
