import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
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
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">📐</span>
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
                        ? "Standard 3MF file format with separate material shapes for each color"
                        : "Zip file with one monochrome image per color and an OpenSCAD file"}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>3D Settings</h1>
                <div class="print-setting-group-options">
                    <label>
                        Pixel Height (mm):
                        <input 
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={pixelHeight}
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        Base Height (mm):
                        <input 
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={baseHeight}
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <span class="description">
                    Pixel height controls the thickness of each colored layer. Base height adds a base platform.
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3DFile()}>Generate 3D File</button>
        </div>
    </div>;
    
    function generate3DFile() {
        const settings: ThreeDSettings = {
            format: format,
            filename: props.filename.replace(".png", ""),
            pixelHeight: pixelHeight,
            baseHeight: baseHeight
        };
        
        window.clarity?.("event", "generate-3d");
        generate3D(props.image, settings);
    }
}
