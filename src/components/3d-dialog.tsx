import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDExportFormat, ThreeDExportSettings } from '../3d-export';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDExportFormat>("3mf");
    const [pixelWidth, setPixelWidth] = useState(5); // 5mm default
    const [pixelHeight, setPixelHeight] = useState(2); // 2mm default
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup value={format} setValue={setFormat} image={props.image} />
            <SizeGroup pixelWidth={pixelWidth} setPixelWidth={setPixelWidth} 
                       pixelHeight={pixelHeight} setPixelHeight={setPixelHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: ThreeDExportSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelWidth,
            pixelHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type OptionGroupFactory<T> = (props: { 
    value: T; 
    setValue: (v: T) => void;
    image: PartListImage;
}) => {
    title: string | JSX.Element;
    values: ReadonlyArray<{
        value: T;
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup<ThreeDExportFormat>(({ image }) => ({
    title: "Format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format - a triangle mesh with separate material shapes for each color. Can be opened in most 3D software.",
            icon: <span class="size-actual">🧊</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "A zip file with monochrome images per color and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="size-legible">📦</span>,
        }
    ]
}));

const SizeGroup = (props: { 
    pixelWidth: number; 
    setPixelWidth: (v: number) => void;
    pixelHeight: number;
    setPixelHeight: (v: number) => void;
}) => {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Width (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelWidth}
                    onChange={(e) => props.setPixelWidth(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelHeight}
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel width controls the horizontal size of each pixel. 
            Pixel height controls the vertical extrusion of the 3D model.
        </span>
    </div>;
};

function makeRadioGroup<T>(factory: OptionGroupFactory<T>) {
    return function (props: { value: T; setValue: (v: T) => void; image: PartListImage }) {
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label>
                    <input type="radio"
                        name="format"
                        checked={v.value === props.value}
                        onChange={() => {
                            props.setValue(v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.value)[0]?.description}</span>
        </div>;
    };
}
