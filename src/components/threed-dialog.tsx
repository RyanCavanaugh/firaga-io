import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [height, setHeight] = useState(props.settings.height);
    const [baseThickness, setBaseThickness] = useState(props.settings.baseThickness);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup 
                height={height}
                baseThickness={baseThickness}
                onHeightChange={setHeight}
                onBaseThicknessChange={setBaseThickness}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            height: height,
            baseThickness: baseThickness,
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
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - industry standard triangle mesh with separate materials for each color. Compatible with most 3D printers and slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome mask images (one per color) and an OpenSCAD file that combines them into a 3D model using surface heightmaps.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

function DimensionsGroup(props: {
    height: number;
    baseThickness: number;
    onHeightChange: (val: number) => void;
    onBaseThicknessChange: (val: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="dimension-inputs">
            <label>
                Layer Height (mm):
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.height}
                    onChange={(e) => props.onHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Base Thickness (mm):
                <input 
                    type="number" 
                    min="0" 
                    step="0.1" 
                    value={props.baseThickness}
                    onChange={(e) => props.onBaseThicknessChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Layer height determines the thickness of each color layer. 
            Base thickness adds a solid base beneath all layers.
        </span>
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
