import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3mf, makeOpenScadZip } from '../3d-generator';
import { AppProps, Print3DProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3d()}>Export</button>
        </div>
    </div>;

    function export3d() {
        window.clarity?.("event", "export-3d");
        if (props.settings.format === "3mf") {
            make3mf(props.image, props.filename.replace(".png", ""));
            updateProp("ui", "is3DOpen", false);
        } else if (props.settings.format === "openscad") {
            makeOpenScadZip(props.image, props.filename.replace(".png", "")).then(() => {
                updateProp("ui", "is3DOpen", false);
            });
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["print3d"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["print3d"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: Print3DProps;
    filename: string;
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Generate a 3D triangle mesh with separate material shapes for each color. Standard 3MF format.",
            icon: <span>🔷</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Generate a ZIP file with monochrome images and an OpenSCAD script that combines them using heightmaps.",
            icon: <span>🎨</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof Print3DProps>(factory: OptionGroupFactory<K>) {
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
                            updateProp("print3d", p.key, v.value);
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
