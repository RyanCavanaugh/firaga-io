import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>(props.settings.format);
    const [height, setHeight] = useState(props.settings.height);
    const [pixelSize, setPixelSize] = useState(props.settings.pixelSize);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SizeGroup height={height} setHeight={setHeight} pixelSize={pixelSize} setPixelSize={setPixelSize} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            height,
            pixelSize
        };

        // Update saved settings
        updateProp("threed", "format", format);
        updateProp("threed", "height", height);
        updateProp("threed", "pixelSize", pixelSize);

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(".png", ""));
        updateProp("ui", "is3DOpen", false);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threed"];
    filename: string;
};

function FormatGroup(props: { format: ThreeDFormat, setFormat: (f: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format."
                : "Zip file with monochrome images per color and OpenSCAD file using heightmap functionality."}
        </span>
    </div>;
}

function SizeGroup(props: { 
    height: number, 
    setHeight: (h: number) => void,
    pixelSize: number,
    setPixelSize: (s: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Size:</span>
                <input 
                    type="number" 
                    value={props.pixelSize} 
                    onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value) || 1)}
                    min="0.1"
                    step="0.1"
                    style="width: 80px; margin-left: 10px;"
                />
            </label>
            <label>
                <span>Height:</span>
                <input 
                    type="number" 
                    value={props.height} 
                    onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value) || 1)}
                    min="0.1"
                    step="0.1"
                    style="width: 80px; margin-left: 10px;"
                />
            </label>
        </div>
        <span class="description">
            Set the size of each pixel and the height of the 3D model in millimeters.
        </span>
    </div>;
}
