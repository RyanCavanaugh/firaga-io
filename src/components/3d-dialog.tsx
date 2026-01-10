import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';
import { generate3MF, ThreeMFSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADMasksSettings } from '../openscad-generator';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [height, setHeight] = useState(2.0);
    
    const pitch = getPitch(props.gridSize);
    
    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio"
                            name="3d-format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} 
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio"
                            name="3d-format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} 
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? 'Standard 3MF file with separate material shapes for each color. Compatible with most 3D printing software.'
                        : 'Zip file containing monochrome heightmap images and an OpenSCAD file that combines them into a 3D model.'}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Height (mm)</h1>
                <div class="height-control">
                    <input 
                        type="range" 
                        min="0.5" 
                        max="10" 
                        step="0.5" 
                        value={height}
                        onChange={(e) => setHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span class="height-value">{height.toFixed(1)} mm</span>
                </div>
                <span class="description">
                    Height of each pixel layer in the 3D model
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '');
        
        if (format === '3mf') {
            const settings: ThreeMFSettings = {
                pitch: pitch,
                height: height,
                filename: filename
            };
            window.clarity?.("event", "export-3mf");
            generate3MF(props.image, settings);
        } else {
            const settings: OpenSCADMasksSettings = {
                pitch: pitch,
                height: height,
                filename: filename
            };
            window.clarity?.("event", "export-openscad");
            generateOpenSCADMasks(props.image, settings);
        }
        
        // Close the dialog after export
        updateProp("ui", "is3DOpen", false);
    }
}
