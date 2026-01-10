import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelWidth, setPixelWidth] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(5);
    const [pixelDepth, setPixelDepth] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup
                pixelWidth={pixelWidth}
                pixelHeight={pixelHeight}
                pixelDepth={pixelDepth}
                setPixelWidth={setPixelWidth}
                setPixelHeight={setPixelHeight}
                setPixelDepth={setPixelDepth}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3dOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelWidth,
            pixelHeight,
            pixelDepth
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ThreeDFormat; setFormat: (f: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color"
                : "ZIP file with monochrome masks and OpenSCAD file for 3D heightmap display"}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelWidth: number;
    pixelHeight: number;
    pixelDepth: number;
    setPixelWidth: (v: number) => void;
    setPixelHeight: (v: number) => void;
    setPixelDepth: (v: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Pixel Dimensions (mm)</h1>
        <div class="dimensions-inputs">
            <label>
                Width:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelWidth}
                    onChange={(e) => props.setPixelWidth(parseFloat((e.target as HTMLInputElement).value))} 
                />
            </label>
            <label>
                Height:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelHeight}
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} 
                />
            </label>
            <label>
                Depth:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelDepth}
                    onChange={(e) => props.setPixelDepth(parseFloat((e.target as HTMLInputElement).value))} 
                />
            </label>
        </div>
        <span class="description">
            Set the physical dimensions of each pixel in millimeters
        </span>
    </div>;
}
