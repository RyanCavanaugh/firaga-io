import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3D, Export3DSettings } from '../3d-export';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [pixelHeight, setPixelHeight] = useState(1.0);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
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
                            <span class="format-icon">📐</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="3d-format" 
                            checked={format === "openscad-masks"}
                            onChange={() => setFormat("openscad-masks")} 
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === "3mf" 
                        ? "Export as 3MF file with separate colored shapes for each color. Compatible with most 3D printing software."
                        : "Export as a ZIP file containing heightmap images and an OpenSCAD file that combines them into a 3D model."}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Layer Height</h1>
                <div class="slider-group">
                    <input 
                        type="range" 
                        min="0.1" 
                        max="5.0" 
                        step="0.1" 
                        value={pixelHeight}
                        onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                        class="slider"
                    />
                    <span class="slider-value">{pixelHeight.toFixed(1)} mm</span>
                </div>
                <span class="description">
                    Height of each color layer in millimeters. Typical values: 0.2-2.0mm
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button 
                class="cancel" 
                onClick={() => updateProp("ui", "is3DExportOpen", false)}
                disabled={isExporting}
            >
                Cancel
            </button>
            <button 
                class="print" 
                onClick={handleExport}
                disabled={isExporting}
            >
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function handleExport() {
        const settings: Export3DSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelHeight
        };

        setIsExporting(true);
        window.clarity?.("event", "3d-export", format);
        
        try {
            await export3D(props.image, settings);
        } catch (error) {
            console.error("3D export failed:", error);
            alert("Export failed. Please check the console for details.");
        } finally {
            setIsExporting(false);
            updateProp("ui", "is3DExportOpen", false);
        }
    }
}
