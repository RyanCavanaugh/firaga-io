import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF, exportOpenSCADMasks } from '../threed-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export</button>
        </div>
    </div>;

    function exportFile() {
        window.clarity?.("event", "3d-export");
        if (props.settings.format === "3mf") {
            export3MF(props.image, props.filename.replace(".png", ""));
        } else if (props.settings.format === "openscad") {
            exportOpenSCADMasks(props.image, props.filename.replace(".png", ""));
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
    settings: AppProps["threed"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as 3MF triangle mesh with separate material shapes for each color. Standard industry format for 3D printing.",
            icon: <span class="threed-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as ZIP with monochrome images per color and an OpenSCAD file using heightmap functionality.",
            icon: <span class="threed-icon">🎭</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threed"]>(factory: OptionGroupFactory<K>) {
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
