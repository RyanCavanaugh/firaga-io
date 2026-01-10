import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3DExport, ThreeDFormat } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDExportDialogProps = {
    image: PartListImage;
    settings: AppProps["threeD"];
    filename: string;
};

export function ThreeDExportDialog(props: ThreeDExportDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;

    function handleExport(): void {
        const cleanFilename = props.filename.replace(/\.(png|jpg|jpeg|gif|bmp)$/i, "");
        window.clarity?.("event", "3d-export");
        generate3DExport(props.image, props.settings.format, cleanFilename);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDExportDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Industry-standard 3D Manufacturing Format with separate colored shapes for each color. Compatible with most 3D modeling software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images per color and an OpenSCAD file that uses heightmaps to create a 3D display.",
            icon: <span class="format-icon">📦</span>,
        },
    ]
}));

function makeRadioGroup<K extends keyof AppProps["threeD"]>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDExportDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
                    <input 
                        type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threeD", p.key, v.value);
                        }} 
                    />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">
                {p.values.find(v => v.value === props.settings[p.key])?.description}
            </span>
        </div>;
    };
}
