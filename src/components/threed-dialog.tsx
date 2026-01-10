import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threed"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            height: props.settings.height,
            baseHeight: props.settings.baseHeight,
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

const FormatGroup = makeRadioGroup((_props: ThreeDDialogProps) => ({
    title: "Format",
    key: "format" as const,
    values: [
        {
            value: "3mf" as const,
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate material shapes for each color. Can be opened in most 3D software.",
            icon: <span class="format-icon">📦</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD",
            description: "ZIP file with black/white mask images and OpenSCAD script that combines them using heightmap functionality.",
            icon: <span class="format-icon">🔧</span>,
        }
    ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <label>
                Pixel Height (mm):
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.height}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        updateProp("threed", "height", parseFloat(target.value));
                    }}
                />
            </label>
            <label>
                Base Height (mm):
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.baseHeight}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        updateProp("threed", "baseHeight", parseFloat(target.value));
                    }}
                />
            </label>
        </div>
        <span class="description">
            Pixel height is the height of each colored pixel. Base height is the substrate/backing plate height.
        </span>
    </div>;
};

function makeRadioGroup<K extends keyof AppProps["threed"]>(factory: OptionGroupFactory<K>) {
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
