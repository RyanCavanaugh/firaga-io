import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [layerHeight, setLayerHeight] = useState(1.0);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <LayerHeightGroup layerHeight={layerHeight} setLayerHeight={setLayerHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D(layerHeight)}>Export 3D</button>
        </div>
    </div>;

    function export3D(height: number) {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            layerHeight: height,
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
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
    format: ThreeDFormat;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Industry standard 3D Manufacturing Format with separate colored layers. Can be opened in most 3D slicing software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

function LayerHeightGroup(props: { layerHeight: number, setLayerHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" 
                    value={props.layerHeight}
                    onChange={(e: any) => props.setLayerHeight(parseFloat(e.target.value))}
                />
                <span> mm per layer</span>
            </label>
        </div>
        <span class="description">Height of each color layer in millimeters</span>
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
