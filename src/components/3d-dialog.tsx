import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [heightPerLayer, setHeightPerLayer] = useState(1);
    const [baseHeight, setBaseHeight] = useState(1);
    
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
                        ? "Export as 3MF file with separate colored shapes for each layer. Compatible with most 3D printing software."
                        : "Export as zip file containing black/white mask images and OpenSCAD file for 3D visualization."}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>3D Parameters</h1>
                <div class="options-group">
                    <label>
                        Height per layer (mm):
                        <input type="number" 
                            value={heightPerLayer} 
                            min="0.1" 
                            step="0.1"
                            onChange={(e) => setHeightPerLayer(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        Base height (mm):
                        <input type="number" 
                            value={baseHeight} 
                            min="0" 
                            step="0.1"
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;
    
    function handleExport() {
        const settings: Export3DSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            heightPerLayer,
            baseHeight
        };
        
        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}
