import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState<number>(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} {...props} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Generate 3D</button>
        </div>
    </div>;

    function generate3D() {
        const settings: ThreeDSettings = {
            format: format,
            pitch: getPitch(props.gridSize),
            height: height,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "3d-export");
        make3D(props.image, settings);
    }
}

type OptionGroupFactory<T> = (props: ThreeDDialogProps & { format: T, setFormat: (v: T) => void }) => {
    title: string | JSX.Element;
    values: ReadonlyArray<{
        value: T;
        title: string | JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup<"3mf" | "openscad-masks">(() => ({
    title: "Format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate material shapes for each color. Can be opened in most 3D modeling software and 3D printers."
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file containing one monochrome image per color and an OpenSCAD file that combines them into a 3D display."
        }
    ]
}));

function HeightGroup(props: { height: number, setHeight: (v: number) => void }) {
    return <div class="print-setting-group">
        <h1>Pixel Height</h1>
        <div class="print-setting-group-options">
            <input 
                type="number" 
                value={props.height} 
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                min="0.1"
                max="10"
                step="0.1"
                style="width: 100px; padding: 5px; font-size: 14px;"
            />
            <span style="margin-left: 10px;">mm</span>
        </div>
        <span class="description">Height of each pixel in the 3D model (in millimeters)</span>
    </div>;
}

function makeRadioGroup<T>(factory: OptionGroupFactory<T>) {
    return function (props: ThreeDDialogProps & { format: T, setFormat: (v: T) => void }) {
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label>
                    <input type="radio"
                        name="format"
                        checked={v.value === props.format}
                        onChange={() => {
                            props.setFormat(v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.format)[0]?.description}</span>
        </div>;
    };
}
