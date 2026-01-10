import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelHeightGroup {...props} />
            <BaseThicknessGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={exportThreeD}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pixelHeight: props.settings.pixelHeight,
            baseThickness: props.settings.baseThickness
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
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

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - industry standard 3D print file with separate materials for each color",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome PNG masks for each color and an OpenSCAD file to combine them",
            icon: <span class="format-icon">🗜️</span>,
        }
    ]
}));

const PixelHeightGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"pixelHeight">> => ({
    key: "pixelHeight",
    title: "Pixel Height",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Thin layers, faster print",
            icon: <span class="height-icon">▫️</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Medium thickness",
            icon: <span class="height-icon">◽</span>
        },
        {
            title: "3mm",
            value: 3,
            description: "Thick, more prominent",
            icon: <span class="height-icon">⬜</span>
        },
    ]
}));

const BaseThicknessGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"baseThickness">> => ({
    key: "baseThickness",
    title: "Base Thickness",
    values: [
        {
            title: "1mm",
            value: 1,
            description: "Minimal base layer",
            icon: <span class="thickness-icon">_</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Standard base layer",
            icon: <span class="thickness-icon">═</span>
        },
        {
            title: "3mm",
            value: 3,
            description: "Thick, sturdy base",
            icon: <span class="thickness-icon">▬</span>
        },
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
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
