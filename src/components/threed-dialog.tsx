import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDFormat, ThreeDSettings } from '../threed-export';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2.5);
    const [pixelSize, setPixelSize] = useState(5);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <DimensionsGroup 
                pixelHeight={pixelHeight} 
                pixelSize={pixelSize}
                onPixelHeightChange={setPixelHeight}
                onPixelSizeChange={setPixelSize}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;
    
    function exportModel() {
        const settings: ThreeDSettings = {
            format,
            pixelHeight,
            pixelSize
        };
        
        window.clarity?.("event", "export-3d");
        export3D(props.image, settings, props.filename);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ThreeDFormat, onFormatChange: (format: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.onFormatChange("3mf")} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.onFormatChange("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🖼️</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Standard 3D Manufacturing Format with separate colored shapes for each pixel color. Compatible with most 3D slicers."
                : "ZIP file containing monochrome mask images and OpenSCAD script to generate 3D model with heightmap rendering."}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelHeight: number,
    pixelSize: number,
    onPixelHeightChange: (value: number) => void,
    onPixelSizeChange: (value: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-inputs">
            <div class="dimension-field">
                <label htmlFor="pixel-size">Pixel Size (X/Y):</label>
                <input 
                    id="pixel-size"
                    type="number" 
                    min="0.5" 
                    max="50" 
                    step="0.5"
                    value={props.pixelSize}
                    onChange={(e) => props.onPixelSizeChange(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span class="unit">mm</span>
            </div>
            <div class="dimension-field">
                <label htmlFor="pixel-height">Pixel Height (Z):</label>
                <input 
                    id="pixel-height"
                    type="number" 
                    min="0.1" 
                    max="20" 
                    step="0.1"
                    value={props.pixelHeight}
                    onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span class="unit">mm</span>
            </div>
        </div>
        <span class="description">
            Pixel Size: Width and depth of each pixel in the 3D model.<br/>
            Pixel Height: Thickness/height of the 3D layer.
        </span>
    </div>;
}
