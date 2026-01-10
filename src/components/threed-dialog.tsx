import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [height, setHeight] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportTo3D()}>Export 3D</button>
        </div>
    </div>;

    function exportTo3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pitch: getPitch(props.gridSize),
            height: height,
            filename: props.filename.replace(".png", "")
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
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Industry-standard 3D Manufacturing Format with separate colored meshes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white mask images and an OpenSCAD script that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Height (mm)</h1>
        <div class="print-setting-group-options">
            <input 
                type="number" 
                min="0.1" 
                max="50" 
                step="0.1" 
                value={props.height} 
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                style="width: 100px; padding: 8px; font-size: 16px;"
            />
        </div>
        <span class="description">Height of the 3D extrusion in millimeters</span>
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
