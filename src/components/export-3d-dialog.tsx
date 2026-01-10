import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../export-3d';
import { AppProps } from '../types';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [height, setHeight] = useState(2);
    const [baseThickness, setBaseThickness] = useState(1);
    
    return <div class="print-dialog export-3d-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === "3mf"}
                            onChange={() => setFormat("3mf")} />
                        <div class="option">
                            <h3>3MF (3D Manufacturing Format)</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === "openscad"}
                            onChange={() => setFormat("openscad")} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎨</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "3MF file with separate material shapes for each color. Compatible with most 3D printing software."
                        : "ZIP file containing black/white masks for each color and an OpenSCAD file to combine them."}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="export-3d-sliders">
                    <label>
                        <span>Pixel Height (mm):</span>
                        <input type="number" 
                            min="0.5" 
                            max="10" 
                            step="0.5"
                            value={height}
                            onChange={(e) => setHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        <span>Base Thickness (mm):</span>
                        <input type="number" 
                            min="0" 
                            max="5" 
                            step="0.5"
                            value={baseThickness}
                            onChange={(e) => setBaseThickness(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;
    
    function handleExport() {
        const settings: Export3DSettings = {
            format,
            height,
            baseThickness
        };
        
        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
};
