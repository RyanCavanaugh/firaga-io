import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <PixelHeightGroup {...props} />
            <BaseHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ''));
    }
}

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
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
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format - triangle mesh with separate materials per color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white mask images and an OpenSCAD script to combine them into a 3D model.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const PixelHeightGroup = makeRadioGroup(() => ({
    title: "Pixel Height",
    key: "pixelHeight",
    values: [
        {
            value: 1,
            title: "1mm",
            description: "Each colored pixel will be 1mm tall",
            icon: <span class="height-icon">▁</span>,
        },
        {
            value: 2,
            title: "2mm",
            description: "Each colored pixel will be 2mm tall",
            icon: <span class="height-icon">▃</span>,
        },
        {
            value: 3,
            title: "3mm",
            description: "Each colored pixel will be 3mm tall",
            icon: <span class="height-icon">▅</span>,
        },
        {
            value: 5,
            title: "5mm",
            description: "Each colored pixel will be 5mm tall",
            icon: <span class="height-icon">▇</span>,
        }
    ]
}));

const BaseHeightGroup = makeRadioGroup(() => ({
    title: "Base Height",
    key: "baseHeight",
    values: [
        {
            value: 0,
            title: "None",
            description: "No base layer - colors only",
            icon: <span class="base-icon">⬜</span>,
        },
        {
            value: 1,
            title: "1mm",
            description: "1mm base layer beneath the colored pixels",
            icon: <span class="base-icon">▔</span>,
        },
        {
            value: 2,
            title: "2mm",
            description: "2mm base layer beneath the colored pixels",
            icon: <span class="base-icon">▀</span>,
        },
        {
            value: 3,
            title: "3mm",
            description: "3mm base layer beneath the colored pixels",
            icon: <span class="base-icon">█</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
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
