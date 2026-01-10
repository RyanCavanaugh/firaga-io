import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3DFile()}>Export 3D</button>
        </div>
    </div>;

    function generate3DFile() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelWidth: props.settings.pixelWidth,
            pixelHeight: props.settings.pixelHeight,
            pixelDepth: props.settings.pixelDepth,
            filename: props.filename.replace(".png", ""),
        };

        window.clarity?.("event", "3d-export");
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
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome mask images and an OpenSCAD script that combines them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
        },
    ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Pixel Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Width:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.settings.pixelWidth}
                    onChange={(e) => updateProp("threed", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("threed", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Depth:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.settings.pixelDepth}
                    onChange={(e) => updateProp("threed", "pixelDepth", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Dimensions of each pixel in the 3D output. Width × Height define the pixel footprint, Depth is the thickness.
        </span>
    </div>;
};

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
