import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../threed-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDFormat;
    heightPerLayer: number;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [heightPerLayer, setHeightPerLayer] = useState(props.settings.heightPerLayer);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup 
                heightPerLayer={heightPerLayer} 
                onHeightChange={setHeightPerLayer}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            heightPerLayer: heightPerLayer,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
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
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate material shapes for each color. Compatible with most 3D slicers.",
            icon: <span class="format-3mf">📦</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images per color and an OpenSCAD file that combines them using heightmaps.",
            icon: <span class="format-openscad">🖼️</span>,
        },
    ]
}));

function HeightGroup(props: { 
    heightPerLayer: number; 
    onHeightChange: (height: number) => void;
}): JSX.Element {
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="height-control">
            <label>
                Height per layer (mm):
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" 
                    value={props.heightPerLayer}
                    onChange={(e) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(value) && value > 0) {
                            props.onHeightChange(value);
                        }
                    }}
                />
            </label>
        </div>
        <span class="description">
            Controls the height/thickness of each color layer in the 3D model.
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
