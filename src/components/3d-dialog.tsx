import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3MF } from '../3mf-generator';
import { makeOpenSCADMasks } from '../openscad-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate()}>Generate</button>
        </div>
    </div>;

    function generate() {
        window.clarity?.("event", "3d-export");
        if (props.settings.format === "3mf") {
            make3MF(props.image, props.filename.replace(".png", ""));
        } else {
            makeOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threeDExport"];
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format" as const,
    values: [
        {
            value: "3mf" as const,
            title: "3MF Triangle Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white images per color and OpenSCAD file",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

type OptionGroupFactory<K extends keyof AppProps["threeDExport"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDExport"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

function makeRadioGroup<K extends keyof AppProps["threeDExport"]>(factory: OptionGroupFactory<K>) {
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
                            updateProp("threeDExport", p.key, v.value);
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
