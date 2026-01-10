import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat } from '../3d-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [height, setHeight] = useState<number>(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const pitch = getPitch(props.gridSize);
        
        window.clarity?.("event", "export-3d");
        generate3D(props.image, {
            format,
            filename: props.filename.replace(".png", ""),
            pitch,
            height
        });
    }
}

type OptionGroupFactory<T> = () => {
    title: string | JSX.Element;
    values: ReadonlyArray<{
        value: T;
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup<ThreeDFormat>(() => ({
    title: "Format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome mask images (one per color) and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const HeightGroup = ({ height, setHeight }: { height: number, setHeight: (h: number) => void }) => {
    return <div class="print-setting-group">
        <h1>Block Height</h1>
        <div class="slider-caption">
            <input 
                type="range" 
                class="slider" 
                onChange={(e: any) => setHeight(parseFloat(e.target.value))} 
                min="0.5" 
                max="10" 
                step="0.5" 
                value={height} 
            />
            <span>{height.toFixed(1)} mm</span>
        </div>
        <span class="description">Height of each color layer in the 3D model</span>
    </div>;
};

function makeRadioGroup<T extends string>(factory: OptionGroupFactory<T>) {
    return function ({ format, setFormat }: { format: T, setFormat: (f: T) => void }) {
        const p = factory();
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label>
                    <input type="radio"
                        name="format"
                        checked={v.value === format}
                        onChange={() => {
                            setFormat(v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === format)[0]?.description}</span>
        </div>;
    };
}
