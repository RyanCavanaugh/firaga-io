import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';
import { getPitch } from '../utils';
import { AppProps } from '../types';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState(3);
    const [baseThickness, setBaseThickness] = useState(2);
    
    const pixelSize = getPitch(props.gridSize);

    return <div class="print-dialog threed-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio" 
                            name="format" 
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} 
                        />
                        <div class="option">
                            <h3>3MF</h3>
                            <span class="format-icon">🧊</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="format" 
                            checked={format === "openscad-masks"}
                            onChange={() => setFormat("openscad-masks")} 
                        />
                        <div class="option">
                            <h3>OpenSCAD</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "3D Manufacturing Format with colored materials. Compatible with most 3D printing software."
                        : "ZIP file with mask images and OpenSCAD script for customizable 3D rendering."}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="options-group">
                    <label>
                        <span>Pixel Height (mm):</span>
                        <input 
                            type="number" 
                            min="0.5" 
                            max="20" 
                            step="0.5"
                            value={height}
                            onChange={(e) => setHeight(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                    <label>
                        <span>Base Thickness (mm):</span>
                        <input 
                            type="number" 
                            min="0" 
                            max="10" 
                            step="0.5"
                            value={baseThickness}
                            onChange={(e) => setBaseThickness(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                    <div class="dimension-info">
                        <span>Pixel Size: {pixelSize.toFixed(2)}mm</span>
                        <span>Model Size: {(props.image.width * pixelSize).toFixed(1)}mm × {(props.image.height * pixelSize).toFixed(1)}mm × {(height + baseThickness).toFixed(1)}mm</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D(): void {
        const settings: ThreeDSettings = {
            format,
            height,
            baseThickness,
            pixelSize
        };

        window.clarity?.("event", "export-3d", format);
        generate3D(props.image, settings);
    }
}
