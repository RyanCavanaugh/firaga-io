import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(0);
    
    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === "openscad"}
                            onChange={() => setFormat("openscad")} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "Exports a 3MF file with separate material shapes for each color. Compatible with most 3D printers and slicers."
                        : "Exports a ZIP file with monochrome images and an OpenSCAD file that combines them into a 3D model using heightmaps."}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>3D Settings</h1>
                <div class="options-group">
                    <label>
                        <span>Pixel Height (mm): </span>
                        <input 
                            type="number" 
                            value={pixelHeight} 
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                            min="0.1"
                            max="10"
                            step="0.1"
                        />
                    </label>
                    <label>
                        <span>Base Height (mm): </span>
                        <input 
                            type="number" 
                            value={baseHeight} 
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                            min="0"
                            max="10"
                            step="0.1"
                        />
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D Model</button>
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
};
