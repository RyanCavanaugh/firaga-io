import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDExportFormat, ThreeDExportSettings } from '../3d-exporters';
import { PropContext } from './context';

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDExportFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2.0);
    const [baseThickness, setBaseThickness] = useState(1.0);
    
    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} />
                        <div class="option">
                            <h3>3MF</h3>
                            <span class="format-icon">🧊</span>
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
                        ? "3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D printing software."
                        : "Zip file containing monochrome masks (one per color) and an OpenSCAD file that combines them into a 3D model using heightmap functionality."}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Settings</h1>
                <div class="setting-input">
                    <label>
                        Pixel Height (mm):
                        <input type="number" 
                            value={pixelHeight} 
                            min="0.1" 
                            max="10" 
                            step="0.1"
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <div class="setting-input">
                    <label>
                        Base Thickness (mm):
                        <input type="number" 
                            value={baseThickness} 
                            min="0" 
                            max="10" 
                            step="0.1"
                            onChange={(e) => setBaseThickness(parseFloat((e.target as HTMLInputElement).value))} />
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
        const settings: ThreeDExportSettings = {
            format,
            pixelHeight,
            baseThickness
        };
        
        window.clarity?.("event", "3d-export");
        export3D(props.image, settings, props.filename.replace(".png", ""));
        updateProp("ui", "is3DExportOpen", false);
    }
}
