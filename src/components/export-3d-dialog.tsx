import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3mf, makeOpenSCADZip } from '../export-3d';
import { AppProps, Export3DProps } from '../types';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="export-3d-dialog">
        <div class="export-3d-options">
            <FormatGroup {...props} />
        </div>
        <div class="export-3d-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3dExportOpen", false)}>Cancel</button>
            <button class="export-3d" onClick={() => exportFormat()}>Export 3D</button>
        </div>
    </div>;

    function exportFormat() {
        window.clarity?.("event", "export-3d");
        if (props.settings.format === "3mf") {
            make3mf(props.image, props.filename.replace(".png", ""));
        } else {
            makeOpenSCADZip(props.image, props.filename.replace(".png", ""));
        }
        updateProp("ui", "is3dExportOpen", false);
    }
}

type OptionGroupFactory<K extends keyof AppProps["export3d"]> = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["export3d"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Model",
            description: "3D model file with separate colored meshes. Compatible with 3D printing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing mask images and OpenSCAD script for 3D display using heightmaps.",
            icon: <span class="format-icon">🔧</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
    return function (props: Export3DDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="export-3d-setting-group">
            <h1>{p.title}</h1>
            <div class="export-3d-setting-group-options">
                {p.values.map(v => <label>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("export3d", p.key, v.value);
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
