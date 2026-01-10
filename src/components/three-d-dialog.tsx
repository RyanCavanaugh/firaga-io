import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../three-d-generator';
import { PropContext } from './context';
import { getPitch } from '../utils';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState(2);

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
                            <span class="format-icon">🔺</span>
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
                        ? "Exports as a 3MF file with separate material shapes for each color. Compatible with most 3D slicers."
                        : "Exports as a ZIP file containing black/white mask images and an OpenSCAD file that combines them into a 3D model."}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Height</h1>
                <div class="height-control">
                    <input 
                        type="number" 
                        min="0.5" 
                        max="20" 
                        step="0.5"
                        value={height}
                        onChange={(e) => setHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </div>
                <span class="description">Height of each pixel in the 3D model</span>
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
            filename: props.filename.replace(".png", ""),
            pitch: getPitch(props.gridSize),
            height
        };

        window.clarity?.("event", "export-3d", format);
        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: string;
    filename: string;
};
