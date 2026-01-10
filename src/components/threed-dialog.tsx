import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
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
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "3d-export");
        generate3D(props.image, settings);
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
            description: "3D Manufacturing Format with separate colored meshes for each color. Compatible with most 3D printing slicers.",
            icon: <span class="threed-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="threed-icon">📦</span>,
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
