import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDOutputProps } from '../types';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { PropContext } from './context';

export function ThreeDOutputDialog(props: ThreeDOutputDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Output Format</h1>
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOutputOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3DOutput()}>Download 3D</button>
        </div>
    </div>;

    function generate3DOutput() {
        const format = props.settings.format;
        
        window.clarity?.("event", "3d-output");
        
        if (format === "3mf") {
            generate3MF(props.image, props.filename.replace(".png", ""));
        } else if (format === "openscad-masks") {
            generateOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDOutput"]> = (props: ThreeDOutputDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDOutput"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDOutputDialogProps = {
    image: PartListImage;
    settings: ThreeDOutputProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Exports as 3MF file with separate material shapes for each color. Standard industry format compatible with most 3D software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Exports as a ZIP file with monochrome images per color and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDOutputProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDOutputDialogProps) {
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
                            updateProp("threeDOutput", p.key, v.value);
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
