import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../export-3d';
import { AppProps } from '../types';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelSizeGroup {...props} />
            <LayerHeightGroup {...props} />
            <BaseHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "isExport3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            pixelSize: props.settings.pixelSize,
            layerHeight: props.settings.layerHeight,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["export3d"]> = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["export3d"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
};

export type Export3DProps = {
    format: Export3DSettings["format"];
    pixelSize: number;
    layerHeight: number;
    baseHeight: number;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate materials for each color. Compatible with most 3D slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "Zip file with monochrome heightmap images and OpenSCAD script to combine them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    key: "pixelSize",
    title: "Pixel Size (mm)",
    values: [
        {
            title: "2.5mm",
            value: 2.5,
            description: "2.5mm per pixel (Perler Mini scale)",
            icon: <span class="size-icon">2.5</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm per pixel (Perler standard scale)",
            icon: <span class="size-icon">5</span>
        },
        {
            title: "8mm",
            value: 8,
            description: "8mm per pixel (LEGO scale)",
            icon: <span class="size-icon">8</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "10mm per pixel",
            icon: <span class="size-icon">10</span>
        }
    ]
}));

const LayerHeightGroup = makeRadioGroup(() => ({
    key: "layerHeight",
    title: "Layer Height (mm)",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "0.5mm layer height - subtle raised effect",
            icon: <span class="height-icon">0.5</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "1mm layer height - moderate raised effect",
            icon: <span class="height-icon">1</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm layer height - pronounced raised effect",
            icon: <span class="height-icon">2</span>
        },
        {
            title: "3mm",
            value: 3,
            description: "3mm layer height - very pronounced effect",
            icon: <span class="height-icon">3</span>
        }
    ]
}));

const BaseHeightGroup = makeRadioGroup(() => ({
    key: "baseHeight",
    title: "Base Height (mm)",
    values: [
        {
            title: "0mm",
            value: 0,
            description: "No base - pixels start at z=0",
            icon: <span class="base-icon">0</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "1mm base height",
            icon: <span class="base-icon">1</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "2mm base height",
            icon: <span class="base-icon">2</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "5mm base height - substantial base",
            icon: <span class="base-icon">5</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
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
