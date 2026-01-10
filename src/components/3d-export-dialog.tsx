import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDSettings } from '../3d-export';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export Options</h1>
            
            <div class="print-setting-group">
                <h2>Format</h2>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio"
                            name="3d-format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} 
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <div class="format-icon">🔺</div>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio"
                            name="3d-format"
                            checked={format === "openscad"}
                            onChange={() => setFormat("openscad")} 
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <div class="format-icon">📦</div>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "Export as standard 3MF file with separate material shapes for each color. Compatible with most 3D printing software."
                        : "Export as a ZIP file containing monochrome mask images and an OpenSCAD file that combines them into a 3D model."}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h2>Pixel Height</h2>
                <div class="slider-container">
                    <input 
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={pixelHeight}
                        onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span class="slider-value">{pixelHeight} mm</span>
                </div>
                <span class="description">
                    Height of each pixel in the 3D model (in millimeters)
                </span>
            </div>
        </div>
        
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;
    
    function handleExport() {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelHeight
        };
        
        window.clarity?.("event", "3d-export", format);
        export3D(props.image, settings);
        updateProp("ui", "is3DExportOpen", false);
    }
}
