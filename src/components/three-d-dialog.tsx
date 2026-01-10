import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../three-d-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: AppProps["threeD"];
    gridSize: AppProps["material"]["size"];
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [pegHeight, setPegHeight] = useState(5);
    const [baseThickness, setBaseThickness] = useState(2);
    
    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup {...props} />
                <DimensionsGroup 
                    pegHeight={pegHeight}
                    baseThickness={baseThickness}
                    onPegHeightChange={setPegHeight}
                    onBaseThicknessChange={setBaseThickness}
                />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
                <button class="print" onClick={() => export3D()}>Export 3D</button>
            </div>
        </div>
    );

    function export3D(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pegHeight,
            baseThickness,
            pitch: getPitch(props.gridSize)
        };

        window.clarity?.("event", "export-3d");
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
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "Triangle mesh with separate material shapes for each color. Industry standard format compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with black/white mask images per color and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="format-icon">🗜️</span>,
        }
    ]
}));

function DimensionsGroup(props: {
    pegHeight: number;
    baseThickness: number;
    onPegHeightChange: (val: number) => void;
    onBaseThicknessChange: (val: number) => void;
}): JSX.Element {
    return (
        <div class="print-setting-group">
            <h1>Dimensions (mm)</h1>
            <div class="print-setting-group-options">
                <label>
                    <span>Peg Height:</span>
                    <input 
                        type="number" 
                        min="1" 
                        max="20" 
                        step="0.5"
                        value={props.pegHeight}
                        onChange={(e) => props.onPegHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Base Thickness:</span>
                    <input 
                        type="number" 
                        min="0.5" 
                        max="10" 
                        step="0.5"
                        value={props.baseThickness}
                        onChange={(e) => props.onBaseThicknessChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            <span class="description">Adjust the height of each peg and the thickness of the base plate</span>
        </div>
    );
}

function makeRadioGroup<K extends keyof AppProps["threeD"]>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return (
            <div class="print-setting-group">
                <h1>{p.title}</h1>
                <div class="print-setting-group-options">
                    {p.values.map(v => (
                        <label>
                            <input 
                                type="radio"
                                name={p.key}
                                checked={v.value === props.settings[p.key]}
                                onChange={() => {
                                    updateProp("threeD", p.key, v.value);
                                }} 
                            />
                            <div class="option">
                                <h3>{v.title}</h3>
                                {v.icon}
                            </div>
                        </label>
                    ))}
                </div>
                <span class="description">
                    {p.values.filter(v => v.value === props.settings[p.key])[0]?.description}
                </span>
            </div>
        );
    };
}
