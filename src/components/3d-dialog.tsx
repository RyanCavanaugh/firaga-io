import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [layerHeight, setLayerHeight] = useState(1.0);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio"
                            name="format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} />
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
                            onChange={() => setFormat("openscad-masks")} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "Export as 3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D printers and slicers."
                        : "Export as a zip file with monochrome mask images and an OpenSCAD file that combines them into a 3D display."}
                </span>
            </div>
            <div class="print-setting-group">
                <h1>Layer Settings</h1>
                <div class="options-group">
                    <label>
                        <span>Layer Height (mm):</span>
                        <input 
                            type="number" 
                            min="0.1" 
                            max="10" 
                            step="0.1" 
                            value={layerHeight}
                            onChange={(e) => setLayerHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: ThreeDSettings = {
            format,
            layerHeight
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
        updateProp("ui", "is3DExportOpen", false);
    }
}
