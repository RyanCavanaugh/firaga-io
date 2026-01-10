import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);

    return <div class="print-dialog">
        <div class="print-options">
            <h2>3D Export Settings</h2>
            
            <div class="option-group">
                <h3>Format</h3>
                <label>
                    <input 
                        type="radio" 
                        name="format" 
                        value="3mf" 
                        checked={format === "3mf"}
                        onChange={() => setFormat("3mf")}
                    />
                    3MF Triangle Mesh
                    <div class="option-description">
                        Standard 3D manufacturing format with separate colored shapes. Can be imported into most 3D modeling software.
                    </div>
                </label>
                <label>
                    <input 
                        type="radio" 
                        name="format" 
                        value="openscad-masks" 
                        checked={format === "openscad-masks"}
                        onChange={() => setFormat("openscad-masks")}
                    />
                    OpenSCAD Masks
                    <div class="option-description">
                        ZIP file with black/white mask images and .scad file. Use OpenSCAD's heightmap feature to create 3D models.
                    </div>
                </label>
            </div>

            <div class="option-group">
                <h3>Dimensions (mm)</h3>
                <label>
                    Pixel Height:
                    <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={pixelHeight}
                        onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    Base Height:
                    <input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        value={baseHeight}
                        onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
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
            pixelHeight,
            baseHeight
        };

        window.clarity?.("event", "export-3d", format);
        make3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}
