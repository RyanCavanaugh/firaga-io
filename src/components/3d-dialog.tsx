import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDSettings["format"]>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [pixelSize, setPixelSize] = useState(2.5);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <SettingsGroup 
                pixelHeight={pixelHeight}
                pixelSize={pixelSize}
                onPixelHeightChange={setPixelHeight}
                onPixelSizeChange={setPixelSize}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={export3D}>Export 3D</button>
        </div>
    </div>;
    
    function export3D(): void {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            pixelHeight,
            pixelSize,
        };
        
        window.clarity?.("event", "3d-export");
        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type FormatGroupProps = {
    format: ThreeDSettings["format"];
    onFormatChange: (format: ThreeDSettings["format"]) => void;
};

function FormatGroup({ format, onFormatChange }: FormatGroupProps): JSX.Element {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={format === "3mf"}
                    onChange={() => onFormatChange("3mf")} 
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
                    checked={format === "openscad-masks"}
                    onChange={() => onFormatChange("openscad-masks")} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D printing software."
                : "ZIP file containing black/white masks for each color and an OpenSCAD file that combines them using heightmap functionality."}
        </span>
    </div>;
}

type SettingsGroupProps = {
    pixelHeight: number;
    pixelSize: number;
    onPixelHeightChange: (value: number) => void;
    onPixelSizeChange: (value: number) => void;
};

function SettingsGroup({ 
    pixelHeight, 
    pixelSize, 
    onPixelHeightChange, 
    onPixelSizeChange 
}: SettingsGroupProps): JSX.Element {
    return <div class="print-setting-group">
        <h1>3D Settings</h1>
        <div class="print-setting-group-options">
            <div class="slider-group">
                <label>
                    <span>Pixel Height (mm): {pixelHeight}</span>
                    <input 
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={pixelHeight}
                        onChange={(e) => onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Pixel Size (mm): {pixelSize}</span>
                    <input 
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={pixelSize}
                        onChange={(e) => onPixelSizeChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Adjust the physical dimensions of each pixel in the 3D model.
        </span>
    </div>;
}
