import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3DExport, Export3DSettings } from '../3d-generator';
import { AppProps, Export3DProps } from '../types';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="export-3d-dialog">
        <div class="export-3d-options">
            <FormatGroup {...props} />
        </div>
        <div class="export-3d-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="export" onClick={() => exportModel()}>Export&nbsp;3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        make3DExport(props.image, settings);
        updateProp("ui", "is3DOpen", false);
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

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF",
            description: "3D Manufacturing Format with separate colored shapes. Compatible with 3D printing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD Masks",
            description: "OpenSCAD file with height map masks for each color. Great for customization and rendering.",
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
