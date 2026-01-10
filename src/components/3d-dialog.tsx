import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3mf-generator';
import { generateOpenSCAD } from '../openscad-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [layerHeight, setLayerHeight] = useState(props.settings.layerHeight);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <LayerHeightGroup layerHeight={layerHeight} setLayerHeight={setLayerHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Export 3D</button>
        </div>
    </div>;
    
    function generate3D(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            layerHeight,
            filename: props.filename.replace(".png", "")
        };
        
        window.clarity?.("event", "export-3d");
        
        if (settings.format === "3mf") {
            generate3MF(props.image, settings);
        } else {
            generateOpenSCAD(props.image, settings);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

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

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Standard 3D printing format with separate meshes per color",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "OpenSCAD heightmaps - ZIP file with mask images and OpenSCAD script",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

function LayerHeightGroup(props: { layerHeight: number; setLayerHeight: (h: number) => void }): JSX.Element {
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.1" 
                    value={props.layerHeight}
                    onInput={(e) => props.setLayerHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span>{props.layerHeight.toFixed(1)} mm</span>
            </label>
        </div>
        <span class="description">Height of each color layer in the 3D model</span>
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
