import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3MF, makeOpenSCADMasks } from '../threed-generator';
import { AppProps } from '../types';
import { getGridSize, getPitch } from '../utils';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            carveSize: getGridSize(props.gridSize),
            pitch: getPitch(props.gridSize),
            filename: props.filename.replace(".png", ""),
        };

        window.clarity?.("event", "export-3d");
        
        if (settings.format === "3mf") {
            make3MF(props.image, settings);
        } else {
            makeOpenSCADMasks(props.image, settings);
        }
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export type Export3DProps = {
    format: "3mf" | "openscad-masks";
};

export type Export3DSettings = {
    format: "3mf" | "openscad-masks";
    carveSize: readonly [number, number];
    pitch: number;
    filename: string;
};

type OptionGroupFactory = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: "format";
    values: ReadonlyArray<{
        value: Export3DProps["format"];
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
            description: "Export as 3MF file with separate material shapes for each color. Compatible with most 3D printers.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Export as a ZIP file containing monochrome images per color and an OpenSCAD file to combine them.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

function makeRadioGroup(factory: OptionGroupFactory) {
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
