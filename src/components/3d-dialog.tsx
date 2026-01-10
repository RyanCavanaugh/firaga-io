import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [height, setHeight] = useState(2);
    const [pixelSize, setPixelSize] = useState(5);

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
                            <h3>3MF</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === "openscad"}
                            onChange={() => setFormat("openscad")} />
                        <div class="option">
                            <h3>OpenSCAD</h3>
                            <span class="format-icon">🔧</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D printing software."
                        : "Zip file containing monochrome masks per color and an OpenSCAD file that combines them using heightmap functionality."}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="settings-group">
                    <label>
                        <span>Pixel Size (mm):</span>
                        <input type="number" 
                            value={pixelSize} 
                            min="1" 
                            max="20" 
                            step="0.5"
                            onChange={(e) => setPixelSize(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        <span>Height (mm):</span>
                        <input type="number" 
                            value={height} 
                            min="0.5" 
                            max="10" 
                            step="0.5"
                            onChange={(e) => setHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <span class="description">
                    Total model size: {(props.image.width * pixelSize).toFixed(1)}mm × {(props.image.height * pixelSize).toFixed(1)}mm × {height}mm
                </span>
            </div>
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

        window.clarity?.("event", "3d-export");
        generate3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}
