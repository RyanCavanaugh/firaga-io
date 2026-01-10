import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3MF, ThreeDSettings } from '../3mf-generator';
import { makeOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [height, setHeight] = useState(2); // mm per layer
    const [baseHeight, setBaseHeight] = useState(1); // mm base
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export</h1>
            
            <div class="print-setting-group">
                <h2>Format</h2>
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
                            <span class="description">Standard 3D manufacturing format with separate shapes per color</span>
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
                            <span class="description">ZIP file with mask images and .scad file for heightmap display</span>
                        </div>
                    </label>
                </div>
            </div>
            
            <div class="print-setting-group">
                <h2>Settings</h2>
                <div class="options-group">
                    <label>
                        Layer Height (mm): 
                        <input 
                            type="number" 
                            min="0.5" 
                            max="10" 
                            step="0.5" 
                            value={height}
                            onChange={(e) => setHeight(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                    {format === '3mf' && (
                        <label>
                            Base Height (mm): 
                            <input 
                                type="number" 
                                min="0" 
                                max="10" 
                                step="0.5" 
                                value={baseHeight}
                                onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
        
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const pitch = getPitch(props.gridSize);
        
        if (format === '3mf') {
            const settings: ThreeDSettings = {
                pitch,
                height,
                baseHeight
            };
            window.clarity?.("event", "export-3mf");
            make3MF(props.image, settings);
        } else {
            const settings: OpenSCADSettings = {
                pitch,
                height
            };
            window.clarity?.("event", "export-openscad");
            makeOpenSCADMasks(props.image, settings);
        }
        
        updateProp("ui", "is3DOpen", false);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
};
