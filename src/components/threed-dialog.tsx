import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelSize, setPixelSize] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} />
                        <div class="option">
                            <h3>3MF</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} />
                        <div class="option">
                            <h3>OpenSCAD</h3>
                            <span class="format-icon">🔧</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? '3MF triangle mesh with separate material shapes for each color'
                        : 'Zip file with monochrome masks and OpenSCAD file'}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Dimensions (mm)</h1>
                <div class="dimension-inputs">
                    <label>
                        <span>Pixel Size:</span>
                        <input 
                            type="number" 
                            value={pixelSize} 
                            onChange={(e) => setPixelSize(Number((e.target as HTMLInputElement).value))}
                            min="1"
                            max="50"
                            step="0.5"
                        />
                        <span>mm</span>
                    </label>
                    <label>
                        <span>Pixel Height:</span>
                        <input 
                            type="number" 
                            value={pixelHeight} 
                            onChange={(e) => setPixelHeight(Number((e.target as HTMLInputElement).value))}
                            min="0.5"
                            max="20"
                            step="0.5"
                        />
                        <span>mm</span>
                    </label>
                    <label>
                        <span>Base Height:</span>
                        <input 
                            type="number" 
                            value={baseHeight} 
                            onChange={(e) => setBaseHeight(Number((e.target as HTMLInputElement).value))}
                            min="0"
                            max="20"
                            step="0.5"
                        />
                        <span>mm</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;
    
    function handleExport() {
        const settings = {
            pixelSize,
            pixelHeight,
            baseHeight,
            filename: props.filename.replace(/\.(png|jpg|jpeg|gif)$/i, '')
        };
        
        if (format === '3mf') {
            export3MF(props.image, settings as Export3MFSettings);
        } else {
            exportOpenSCADMasks(props.image, settings as ExportOpenSCADSettings);
        }
        
        window.clarity?.("event", "export-3d", format);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};
