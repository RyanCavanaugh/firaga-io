import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat } from '../3d-export';
import { PropContext } from './context';

export interface Export3DDialogProps {
    image: PartListImage;
    filename: string;
    gridSize: string;
}

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2.5);
    const [pixelSize, setPixelSize] = useState(5);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
                pixelSize={pixelSize}
                setPixelSize={setPixelSize}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;

    function handleExport() {
        const settings = {
            format,
            pixelHeight,
            pixelSize
        };

        window.clarity?.("event", "export-3d", format);
        export3D(props.image, settings, props.filename.replace(".png", ""));
    }
}

function FormatGroup(props: { format: Export3DFormat; setFormat: (f: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")}
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
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software."
                : "Zip file with monochrome mask images and OpenSCAD file that combines them into a 3D visualization."}
        </span>
    </div>;
}

function SettingsGroup(props: {
    pixelHeight: number;
    setPixelHeight: (v: number) => void;
    pixelSize: number;
    setPixelSize: (v: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>3D Settings</h1>
        <div class="settings-sliders">
            <label>
                <span>Pixel Height (mm): {props.pixelHeight.toFixed(1)}</span>
                <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={props.pixelHeight}
                    onInput={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Size (mm): {props.pixelSize.toFixed(1)}</span>
                <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={props.pixelSize}
                    onInput={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Adjust the dimensions of each pixel in the 3D model (in millimeters).
        </span>
    </div>;
}
