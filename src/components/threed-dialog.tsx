import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { makeThreeD, ThreeDSettings } from '../threed-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [pixelSize, setPixelSize] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="options-group">
                <h2>Format</h2>
                <label>
                    <input 
                        type="radio" 
                        name="format" 
                        value="3mf" 
                        checked={format === "3mf"} 
                        onChange={() => setFormat("3mf")} 
                    />
                    <span>3MF (Triangle Mesh)</span>
                </label>
                <p class="option-description">
                    Standard 3D manufacturing format with separate colored shapes.
                </p>
                
                <label>
                    <input 
                        type="radio" 
                        name="format" 
                        value="openscad-masks" 
                        checked={format === "openscad-masks"} 
                        onChange={() => setFormat("openscad-masks")} 
                    />
                    <span>OpenSCAD Masks (Heightmap)</span>
                </label>
                <p class="option-description">
                    Zip file with heightmap images and OpenSCAD file for customization.
                </p>
            </div>

            <div class="options-group">
                <h2>Dimensions</h2>
                <label>
                    Pixel Size (mm):
                    <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        value={pixelSize} 
                        onChange={(e) => setPixelSize(Number((e.target as HTMLInputElement).value))} 
                    />
                </label>
                <label>
                    Pixel Height (mm):
                    <input 
                        type="number" 
                        min="0.5" 
                        max="20" 
                        step="0.5" 
                        value={pixelHeight} 
                        onChange={(e) => setPixelHeight(Number((e.target as HTMLInputElement).value))} 
                    />
                </label>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD() {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            pixelSize,
            pixelHeight
        };

        window.clarity?.("event", "export-3d");
        makeThreeD(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};
