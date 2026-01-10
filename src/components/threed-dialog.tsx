import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [pixelHeight, setPixelHeight] = useState(props.settings.pixelHeight);
    const [baseHeight, setBaseHeight] = useState(props.settings.baseHeight);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup 
                pixelHeight={pixelHeight}
                baseHeight={baseHeight}
                onPixelHeightChange={setPixelHeight}
                onBaseHeightChange={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pixelHeight,
            baseHeight,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
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

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate colored shapes. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with color masks and OpenSCAD file for customizable 3D display.",
            icon: <span class="format-icon">📦</span>,
        },
    ]
}));

function HeightGroup(props: {
    pixelHeight: number;
    baseHeight: number;
    onPixelHeightChange: (value: number) => void;
    onBaseHeightChange: (value: number) => void;
}): JSX.Element {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="height-controls">
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.pixelHeight}
                    onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    step="0.1"
                    value={props.baseHeight}
                    onChange={(e) => props.onBaseHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel height controls the thickness of each colored layer. Base height adds a foundation layer.
        </span>
    </div>;
}

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
