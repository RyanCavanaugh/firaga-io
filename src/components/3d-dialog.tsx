import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [baseHeight, setBaseHeight] = useState(2);
    const [pixelHeight, setPixelHeight] = useState(5);
    const [pixelSize, setPixelSize] = useState(5);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">📐</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === "openscad"}
                            onChange={() => setFormat("openscad")} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "Standard 3MF file format with separate material shapes for each color. Compatible with most 3D printing software."
                        : "Zip file containing black/white mask images and an OpenSCAD file that combines them into a 3D display."}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="dimension-controls">
                    <label>
                        <span>Base Height (mm):</span>
                        <input 
                            type="number" 
                            min="0.5" 
                            max="20" 
                            step="0.5"
                            value={baseHeight}
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        <span>Pixel Height (mm):</span>
                        <input 
                            type="number" 
                            min="1" 
                            max="50" 
                            step="0.5"
                            value={pixelHeight}
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        <span>Pixel Size (mm):</span>
                        <input 
                            type="number" 
                            min="1" 
                            max="50" 
                            step="0.5"
                            value={pixelSize}
                            onChange={(e) => setPixelSize(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <span class="description">
                    Total model size: {(props.image.width * pixelSize).toFixed(1)}mm × {(props.image.height * pixelSize).toFixed(1)}mm × {(baseHeight + pixelHeight).toFixed(1)}mm
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
            baseHeight,
            pixelHeight,
            pixelSize
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}
