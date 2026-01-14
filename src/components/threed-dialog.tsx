import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generateThreeD, ThreeDSettings } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="threeD-dialog">
        <div class="threeD-options">
            <FormatGroup {...props} />
        </div>
        <div class="threeD-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3dOpen", false)}>Cancel</button>
            <button class="export" onClick={() => exportThreeD()}>Export&nbsp;3D</button>
        </div>
    </div>;

    function exportThreeD() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
        };

        window.clarity?.("event", "export-3d");
        generateThreeD(props.image, settings, props.gridSize);
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
    settings: AppProps["threeD"];
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as a 3D Model File (3MF) with separate material shapes for each color. Compatible with most 3D printers and viewers.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Export as OpenSCAD script with monochrome mask images. Allows customization and tweaking of the 3D model.",
            icon: <span class="format-icon">🔧</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threeD"]>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="threeD-setting-group">
            <h1>{p.title}</h1>
            <div class="threeD-setting-group-options">
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
