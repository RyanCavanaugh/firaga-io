import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [height, setHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup height={height} setHeight={setHeight} baseHeight={baseHeight} setBaseHeight={setBaseHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate()}>Generate 3D</button>
        </div>
    </div>;

    function generate() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pitch: getPitch(props.gridSize),
            height: height,
            baseHeight: baseHeight,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "3d-generate");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
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
            title: "3MF",
            description: "3D Manufacturing Format - Industry standard triangle mesh with separate material shapes for each color. Compatible with most 3D printers and slicers.",
            icon: <span style="font-size: 2em;">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white images per color and an OpenSCAD file that uses heightmap functionality to create 3D models.",
            icon: <span style="font-size: 2em;">🎭</span>,
        }
    ]
}));

function DimensionsGroup(props: { 
    height: number, 
    setHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                Pixel Height: 
                <input 
                    type="number" 
                    min="0.5" 
                    max="10" 
                    step="0.5" 
                    value={props.height}
                    onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Base Height: 
                <input 
                    type="number" 
                    min="0" 
                    max="5" 
                    step="0.5" 
                    value={props.baseHeight}
                    onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">Pixel height determines the thickness of each colored layer. Base height adds a foundation plate (0 for no base).</span>
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
