import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../3mf-generator';
import { AppProps } from '../types';
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
            <button class="print" onClick={() => exportModel()}>Export 3D Model</button>
        </div>
    </div>;

    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            pixelWidth: props.settings.pixelWidth,
            baseHeight: props.settings.baseHeight,
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings, props.filename);
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

export type ThreeDProps = {
    format: ThreeDSettings["format"];
    pixelHeight: number;
    pixelWidth: number;
    baseHeight: number;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "OpenSCAD script file that generates the 3D model procedurally. Can be edited and customized.",
            icon: <span class="format-icon">🔧</span>,
        }
    ]
}));

const DimensionsGroup = function(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Width/Depth:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.pixelWidth}
                    onChange={(e) => updateProp("threed", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("threed", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number" 
                    min="0" 
                    step="0.1"
                    value={props.settings.baseHeight}
                    onChange={(e) => updateProp("threed", "baseHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel dimensions determine the size of each colored block. Base height is the Z-offset from the origin.
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
