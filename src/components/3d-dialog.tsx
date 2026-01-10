import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [heightPerLayer, setHeightPerLayer] = useState(1);
    
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
                        ? "Export as a 3MF file with separate colored shapes for each layer. Compatible with most 3D modeling software."
                        : "Export as a ZIP file containing black/white masks and an OpenSCAD file to create a 3D model."}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Layer Height</h1>
                <div class="options-group">
                    <label>
                        Height per layer (mm):
                        <input type="number" 
                            value={heightPerLayer} 
                            min="0.1" 
                            max="10" 
                            step="0.1"
                            onChange={(e) => setHeightPerLayer(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <span class="description">
                    Each color layer will be {heightPerLayer}mm thick in the 3D model.
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
            heightPerLayer
        };

        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
    }
}
