import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [layerHeight, setLayerHeight] = useState(2);
    const [pixelSize, setPixelSize] = useState(5);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup 
                layerHeight={layerHeight} 
                setLayerHeight={setLayerHeight}
                pixelSize={pixelSize}
                setPixelSize={setPixelSize}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: Export3DSettings = {
            format,
            layerHeight,
            pixelSize
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
};

function FormatGroup(props: { format: "3mf" | "openscad", setFormat: (f: "3mf" | "openscad") => void }) {
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
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format."
                : "Zip file with monochrome masks and OpenSCAD file using heightmap functionality."}
        </span>
    </div>;
}

function SettingsGroup(props: {
    layerHeight: number,
    setLayerHeight: (n: number) => void,
    pixelSize: number,
    setPixelSize: (n: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Settings</h1>
        <div class="print-setting-group-options">
            <div class="option-vertical">
                <label>
                    <span>Layer Height (mm):</span>
                    <input 
                        type="number" 
                        min="0.1" 
                        max="10" 
                        step="0.1"
                        value={props.layerHeight}
                        onChange={(e) => props.setLayerHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Pixel Size (mm):</span>
                    <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        step="1"
                        value={props.pixelSize}
                        onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Layer height determines the Z-axis thickness. Pixel size sets the XY dimensions.
        </span>
    </div>;
}
