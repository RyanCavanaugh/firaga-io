import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { makeThreeD, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { getGridSize, getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate()}>Export&nbsp;3D</button>
        </div>
    </div>;

    function generate() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pitch: getPitch(props.gridSize),
            gridSize: props.gridSize
        };

        window.clarity?.("event", "export-3d");
        makeThreeD(props.image, settings);
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
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Model",
            description: "Export as a 3MF triangle mesh file. Each color is a separate shape with its own material color.",
            icon: <span>🔷</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as an OpenSCAD script with black/white mask images. Combines masks using heightmaps to create a 3D representation.",
            icon: <span>📐</span>,
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
