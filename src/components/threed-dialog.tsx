import * as preact from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../threed-3mf';
import { generateOpenSCADMasks } from '../threed-openscad';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threed"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Export 3D</button>
        </div>
    </div>;

    function generate3D() {
        window.clarity?.("event", "export-3d");
        
        const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "");
        
        if (props.settings.format === "3mf") {
            generate3MF(props.image, filename);
            updateProp("ui", "is3DOpen", false);
        } else {
            generateOpenSCADMasks(props.image, filename).then(() => {
                updateProp("ui", "is3DOpen", false);
            }).catch(err => {
                console.error("Failed to generate OpenSCAD masks:", err);
                updateProp("ui", "is3DOpen", false);
            });
        }
    }
}

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate colored materials for each color",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images and OpenSCAD file for 3D display",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | preact.JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
        title: string | preact.JSX.Element;
        icon: preact.JSX.Element;
        description: string | preact.JSX.Element;
    }>;
}

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
