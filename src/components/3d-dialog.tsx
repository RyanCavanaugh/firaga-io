import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings, ExportFormat } from '../3d-export';
import { AppProps } from '../types';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>("3mf");
    const [pixelSize, setPixelSize] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SizeGroup pixelSize={pixelSize} setPixelSize={setPixelSize} pixelHeight={pixelHeight} setPixelHeight={setPixelHeight} />
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
            pixelSize,
            pixelHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ExportFormat, setFormat: (f: ExportFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">📐</span>
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
                ? "Export as 3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software."
                : "Export as ZIP file with monochrome PNG masks and OpenSCAD file that combines them into a 3D heightmap display."}
        </span>
    </div>;
}

function SizeGroup(props: { 
    pixelSize: number, 
    setPixelSize: (n: number) => void,
    pixelHeight: number,
    setPixelHeight: (n: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <div class="dimension-controls">
                <label class="dimension-label">
                    <span>Pixel Size (mm)</span>
                    <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        step="0.5"
                        value={props.pixelSize}
                        onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                        class="dimension-input"
                    />
                </label>
                <label class="dimension-label">
                    <span>Pixel Height (mm)</span>
                    <input 
                        type="number" 
                        min="0.5" 
                        max="20" 
                        step="0.5"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                        class="dimension-input"
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Pixel size controls the width/depth of each pixel. Pixel height controls how tall each pixel is extruded.
        </span>
    </div>;
}
