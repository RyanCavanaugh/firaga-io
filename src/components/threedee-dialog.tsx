import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps['threedee'];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup 
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

    function exportModel() {
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

type OptionGroupFactory<K extends keyof AppProps["threedee"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threedee"][K];
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
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome mask images and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        },
    ]
}));

function DimensionsGroup(props: {
    pixelHeight: number;
    baseHeight: number;
    onPixelHeightChange: (value: number) => void;
    onBaseHeightChange: (value: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Height: </span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" 
                    value={props.pixelHeight}
                    onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span> mm</span>
            </label>
            <label>
                <span>Base Height: </span>
                <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1" 
                    value={props.baseHeight}
                    onChange={(e) => props.onBaseHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span> mm</span>
            </label>
        </div>
        <span class="description">
            Pixel height is the Z-height of each colored pixel. Base height is the starting Z position.
        </span>
    </div>;
}

function makeRadioGroup<K extends keyof AppProps['threedee']>(factory: OptionGroupFactory<K>) {
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
                            updateProp("threedee", p.key, v.value);
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
