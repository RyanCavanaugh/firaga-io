import * as preact from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-export';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    settings: AppProps['export3d'];
    gridSize: AppProps['material']['size'];
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            pitch: getPitch(props.gridSize),
            height: props.settings.height,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["export3d"]> = (props: Export3DDialogProps) => {
    title: string | preact.JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["export3d"][K];
        title: string | preact.JSX.Element;
        icon: preact.JSX.Element;
        description: string | preact.JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format" as const,
    values: [
        {
            value: "3mf" as const,
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate materials for each color. Compatible with most 3D software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD",
            description: "Zip file containing mask images and an OpenSCAD script that combines them into a 3D model.",
            icon: <span class="format-icon">🗜️</span>,
        },
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    title: "Height (mm)",
    key: "height" as const,
    values: [
        {
            value: 2,
            title: "2mm",
            description: "Thin profile",
            icon: <span class="height-icon">▁</span>,
        },
        {
            value: 5,
            title: "5mm",
            description: "Standard height",
            icon: <span class="height-icon">▃</span>,
        },
        {
            value: 10,
            title: "10mm",
            description: "Thick profile",
            icon: <span class="height-icon">▅</span>,
        },
    ]
}));

function makeRadioGroup<K extends keyof AppProps["export3d"]>(factory: OptionGroupFactory<K>) {
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
