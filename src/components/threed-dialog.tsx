import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat } from '../3d-generator';
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
        const format = props.settings.format;
        const cleanFilename = props.filename.replace(/\.(png|jpe?g|gif|bmp)$/i, '');
        
        window.clarity?.("event", "export-3d");
        generate3D(props.image, format, cleanFilename);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDFormat;
};

type OptionGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: keyof ThreeDProps;
    values: ReadonlyArray<{
        value: ThreeDFormat;
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Industry standard 3D Manufacturing Format with separate material shapes for each color. Compatible with 3D printing software.",
            icon: <span class="format-3mf">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images per color and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-openscad">🎭</span>,
        }
    ]
}));

function makeRadioGroup(factory: OptionGroupFactory) {
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
