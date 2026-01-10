import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        // Update pixel dimensions based on size selection
        let pixelWidth = props.settings.pixelWidth;
        let pixelHeight = props.settings.pixelHeight;
        let baseHeight = props.settings.baseHeight;
        
        if (props.settings.dimensions === "small") {
            pixelWidth = pixelHeight = 2.5;
            baseHeight = 1.5;
        } else if (props.settings.dimensions === "medium") {
            pixelWidth = pixelHeight = 5;
            baseHeight = 2;
        } else if (props.settings.dimensions === "large") {
            pixelWidth = pixelHeight = 10;
            baseHeight = 3;
        }
        
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight,
            pixelWidth,
            baseHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings, props.filename.replace(".png", ""));
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
}

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Mesh",
            description: "Standard 3D manufacturing format with colored triangle meshes. Compatible with most 3D printing slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images and an OpenSCAD script that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeRadioGroup(() => ({
    key: "dimensions" as const,
    title: "Pixel Dimensions",
    values: [
        {
            title: "Small (2.5mm)",
            value: "small" as const,
            description: "2.5mm per pixel, good for mini beads",
            icon: <span class="size-icon">S</span>
        },
        {
            title: "Medium (5mm)",
            value: "medium" as const,
            description: "5mm per pixel, good for standard beads",
            icon: <span class="size-icon">M</span>
        },
        {
            title: "Large (10mm)",
            value: "large" as const,
            description: "10mm per pixel, good for LEGO studs",
            icon: <span class="size-icon">L</span>
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
