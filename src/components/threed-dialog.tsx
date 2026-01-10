import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeMFSettings } from '../threemf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelSize, setPixelSize] = useState(5);
    const [baseHeight, setBaseHeight] = useState(2);
    const [heightPerLayer, setHeightPerLayer] = useState(1);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio"
                            name="format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} 
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">📐</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio"
                            name="format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} 
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? 'Standard 3D manufacturing format with separate colored shapes for each color'
                        : 'Generates mask images and OpenSCAD file for heightmap-based 3D rendering'}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Model Settings</h1>
                <div class="settings-inputs">
                    <label>
                        Pixel Size (mm):
                        <input 
                            type="number" 
                            value={pixelSize} 
                            min="1" 
                            max="50" 
                            step="0.5"
                            onChange={(e) => setPixelSize(parseFloat((e.target as HTMLInputElement).value))} 
                        />
                    </label>
                    <label>
                        Base Height (mm):
                        <input 
                            type="number" 
                            value={baseHeight} 
                            min="0" 
                            max="20" 
                            step="0.5"
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))} 
                        />
                    </label>
                    <label>
                        Layer Height (mm):
                        <input 
                            type="number" 
                            value={heightPerLayer} 
                            min="0.1" 
                            max="10" 
                            step="0.1"
                            onChange={(e) => setHeightPerLayer(parseFloat((e.target as HTMLInputElement).value))} 
                        />
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeMFSettings | OpenSCADSettings = {
            pixelSize,
            baseHeight,
            heightPerLayer
        };

        const filename = props.filename.replace(".png", "");

        window.clarity?.("event", "3d-export");
        
        if (format === '3mf') {
            generate3MF(props.image, settings, filename);
        } else {
            generateOpenSCADMasks(props.image, settings, filename);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};
