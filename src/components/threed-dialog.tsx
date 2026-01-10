import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../export-3d';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelHeightGroup {...props} />
            <BaseHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ''));
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as Export3DFormat,
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate materials per color. Industry standard for 3D printing.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad" as Export3DFormat,
            title: "OpenSCAD",
            description: "OpenSCAD masks - ZIP file with monochrome images per color and .scad file for 3D visualization.",
            icon: <span class="format-icon">🎨</span>,
        }
    ]
}));

const PixelHeightGroup = makeRadioGroup(() => ({
    key: "pixelHeight",
    title: "Pixel Height",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Thin layer - 1 millimeter per pixel",
            icon: <span class="height-icon">▫️</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Standard layer - 2 millimeters per pixel",
            icon: <span class="height-icon">◽</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Thick layer - 5 millimeters per pixel",
            icon: <span class="height-icon">⬜</span>
        }
    ]
}));

const BaseHeightGroup = makeRadioGroup(() => ({
    key: "baseHeight",
    title: "Base Height",
    values: [
        {
            title: "None",
            value: 0,
            description: "No base layer",
            icon: <span class="base-icon">⚪</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "1 millimeter base layer",
            icon: <span class="base-icon">🔘</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2 millimeter base layer",
            icon: <span class="base-icon">⚫</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
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
                            updateProp("threeD", p.key, v.value);
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
