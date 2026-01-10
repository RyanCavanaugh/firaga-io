import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseThickness, setBaseThickness] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <SettingsGroup 
                pixelHeight={pixelHeight}
                baseThickness={baseThickness}
                onPixelHeightChange={setPixelHeight}
                onBaseThicknessChange={setBaseThickness}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelHeight,
            baseThickness
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: Export3DFormat, onFormatChange: (format: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.onFormatChange("3mf")}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.onFormatChange("openscad")}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Standard 3D Manufacturing Format - triangle mesh with separate materials for each color. Compatible with most 3D printing software."
                : "Zip file containing monochrome mask images and an OpenSCAD script that uses heightmap functionality to create a 3D display."}
        </span>
    </div>;
}

function SettingsGroup(props: {
    pixelHeight: number,
    baseThickness: number,
    onPixelHeightChange: (value: number) => void,
    onBaseThicknessChange: (value: number) => void
}) {
    return <div class="print-setting-group">
        <h1>3D Settings</h1>
        <div class="settings-inputs">
            <label>
                <span>Pixel Height (mm):</span>
                <input 
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={props.pixelHeight}
                    onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Thickness (mm):</span>
                <input 
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={props.baseThickness}
                    onChange={(e) => props.onBaseThicknessChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel height controls the vertical size of each colored pixel. Base thickness adds a flat base layer.
        </span>
    </div>;
}
