import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useRef, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDFormat, ThreeDSettings } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            pixelHeight,
            baseHeight
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ThreeDFormat, setFormat: (f: ThreeDFormat) => void }) {
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
                    <span>📦</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} 
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span>🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D printers."
                : "Zip file with monochrome masks and OpenSCAD file. Loads images using heightmap functionality."
            }
        </span>
    </div>;
}

function SettingsGroup(props: { 
    pixelHeight: number, 
    setPixelHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Settings</h1>
        <div class="print-setting-group-options">
            <div class="option-vertical">
                <label>
                    <span>Pixel Height (mm):</span>
                    <input 
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Base Height (mm):</span>
                    <input 
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={props.baseHeight}
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Pixel height controls the Z-axis height of each colored pixel. Base height is the height of the foundation layer.
        </span>
    </div>;
}
