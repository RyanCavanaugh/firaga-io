import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3d-generator-3mf';
import { generateOpenSCADMasks, OpenSCADSettings } from '../3d-generator-openscad';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} />
                        <div class="option">
                            <h3>3MF Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? 'Standard 3MF file with separate colored shapes for each color. Compatible with most 3D printing software.'
                        : 'ZIP file containing PNG masks and an OpenSCAD file for customizable 3D models.'}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="dimension-controls">
                    <label>
                        <span>Base Height (mm):</span>
                        <input type="number" 
                            min="0.5" 
                            max="10" 
                            step="0.5" 
                            value={baseHeight}
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                    <label>
                        <span>Pixel Height (mm):</span>
                        <input type="number" 
                            min="0.5" 
                            max="10" 
                            step="0.5" 
                            value={pixelHeight}
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} />
                    </label>
                </div>
                <span class="description">
                    Base provides structural support. Pixel height determines color layer thickness.
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Export 3D</button>
        </div>
    </div>;
    
    async function generate3D() {
        const filename = props.filename.replace(".png", "");
        
        if (format === '3mf') {
            const settings: ThreeDSettings = {
                format: '3mf',
                pixelHeight,
                baseHeight,
                filename
            };
            window.clarity?.("event", "export-3d-3mf");
            await generate3MF(props.image, settings);
        } else {
            const settings: OpenSCADSettings = {
                pixelHeight,
                baseHeight,
                filename
            };
            window.clarity?.("event", "export-3d-openscad");
            await generateOpenSCADMasks(props.image, settings);
        }
        
        updateProp("ui", "is3DOpen", false);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};
