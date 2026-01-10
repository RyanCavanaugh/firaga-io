import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCAD, ExportOpenSCADSettings } from '../export-openscad';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type ExportFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [pixelSize, setPixelSize] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);
    const [heightScale, setHeightScale] = useState(1);
    
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
                            <h3>3MF Triangle Mesh</h3>
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
                        ? 'Export as 3MF file with separate material shapes for each color. Compatible with 3D slicers and modeling software.'
                        : 'Export as a zip file containing black/white masks per color and an OpenSCAD file that combines them into a 3D display.'}
                </span>
            </div>
            
            <div class="print-setting-group">
                <h1>Dimensions</h1>
                <div class="dimension-controls">
                    <label>
                        <span>Pixel Size (mm):</span>
                        <input 
                            type="number" 
                            value={pixelSize} 
                            onChange={(e) => setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                            min="0.1"
                            step="0.1"
                        />
                    </label>
                    {format === '3mf' ? (
                        <label>
                            <span>Pixel Height (mm):</span>
                            <input 
                                type="number" 
                                value={pixelHeight} 
                                onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                                min="0.1"
                                step="0.1"
                            />
                        </label>
                    ) : (
                        <label>
                            <span>Height Scale:</span>
                            <input 
                                type="number" 
                                value={heightScale} 
                                onChange={(e) => setHeightScale(parseFloat((e.target as HTMLInputElement).value))}
                                min="0.1"
                                step="0.1"
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;
    
    function handleExport() {
        const filename = props.filename.replace(".png", "");
        
        if (format === '3mf') {
            const settings: Export3MFSettings = {
                filename,
                pixelWidth: pixelSize,
                pixelHeight: pixelHeight,
                baseHeight: 0
            };
            export3MF(props.image, settings);
        } else {
            const settings: ExportOpenSCADSettings = {
                filename,
                pixelSize,
                heightScale
            };
            exportOpenSCAD(props.image, settings);
        }
        
        window.clarity?.("event", "3d-export");
        updateProp("ui", "is3DOpen", false);
    }
}
