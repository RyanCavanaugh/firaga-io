import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, Export3DProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../export-3d-3mf';
import { generateOpenSCADZip } from '../export-3d-openscad';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);

    function export3D() {
        const settings = props.settings;
        const filename = props.filename.replace(".png", "");

        window.clarity?.("event", "export-3d");

        if (settings.format === "3mf") {
            generate3MF(props.image, filename);
        } else if (settings.format === "openscad") {
            generateOpenSCADZip(props.image, filename);
        }

        updateProp("ui", "isExport3DOpen", false);
    }

    return <div class="export-3d-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "isExport3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
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
            title: "3MF Triangle Mesh",
            description: "Export as 3MF (3D Manufacturing Format) with separate triangle meshes for each color",
            icon: <span>📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as OpenSCAD .scad file with monochrome image masks (one per color)",
            icon: <span>🔧</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
    return function (props: Export3DDialogProps) {
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
