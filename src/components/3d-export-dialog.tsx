import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export</button>
        </div>
    </div>;

    function exportFile() {
        const settings: ThreeDExportSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pitch: props.pitch,
        };

        window.clarity?.("event", "3d-export");
        
        if (settings.format === "3mf") {
            generate3MF(props.image, settings);
        } else if (settings.format === "openscad") {
            generateOpenSCADMasks(props.image, settings);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDExport"]> = (props: ThreeDExportDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDExport"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    settings: ThreeDExportProps;
    filename: string;
    pitch: number;
};

export type ThreeDExportProps = {
    format: "3mf" | "openscad";
};

export type ThreeDExportSettings = {
    format: "3mf" | "openscad";
    filename: string;
    pitch: number;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Export as a 3MF file with separate material shapes for each color. Compatible with 3D printing software.",
            icon: <span class="format-3mf">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as a ZIP file containing monochrome images and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-openscad">📦</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDExportProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDExportDialogProps) {
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
