import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings, ThreeDFormat } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <ParametersGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pixelHeight: props.settings.pixelHeight,
            baseThickness: props.settings.baseThickness,
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
        icon?: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDFormat;
    pixelHeight: number;
    baseThickness: number;
};

const FormatGroup = makeRadioGroup(({ }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate colored shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white mask images and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

function ParametersGroup(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>3D Parameters</h1>
        <div class="threed-params">
            <label>
                <span>Pixel Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("threed", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Thickness (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.baseThickness}
                    onChange={(e) => updateProp("threed", "baseThickness", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
    </div>;
}

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
