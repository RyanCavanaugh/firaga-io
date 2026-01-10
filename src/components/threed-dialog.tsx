import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../threed-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [pixelWidth, setPixelWidth] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseThickness, setBaseThickness] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} />
                        <div class="option">
                            <h3>3MF Mesh</h3>
                            <span class="format-icon">🔷</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === "openscad-masks"}
                            onChange={() => setFormat("openscad-masks")} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "3MF file with separate material shapes for each color. Compatible with most 3D slicers."
                        : "ZIP file with PNG masks and OpenSCAD file for customization."}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="dimension-controls">
                    <label>
                        Pixel Width (mm):
                        <input type="number" 
                            min="1" 
                            max="50" 
                            step="0.5"
                            value={pixelWidth}
                            onChange={(e) => setPixelWidth(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        Pixel Height (mm):
                        <input type="number" 
                            min="0.5" 
                            max="20" 
                            step="0.5"
                            value={pixelHeight}
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        Base Thickness (mm):
                        <input type="number" 
                            min="0.5" 
                            max="10" 
                            step="0.5"
                            value={baseThickness}
                            onChange={(e) => setBaseThickness(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <span class="description">
                    Total size: {(props.image.width * pixelWidth).toFixed(1)} × {(props.image.height * pixelWidth).toFixed(1)} × {(baseThickness + pixelHeight).toFixed(1)} mm
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
            pixelWidth,
            pixelHeight,
            baseThickness
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}
