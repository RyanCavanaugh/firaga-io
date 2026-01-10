import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generateThreeMF, ThreeMFSettings } from '../threemf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type ExportFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [pixelSize, setPixelSize] = useState(2.5); // mm
    const [pixelThickness, setPixelThickness] = useState(2.0); // mm (for 3MF)
    const [heightPerLayer, setHeightPerLayer] = useState(1.0); // mm (for OpenSCAD)
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <h3>3D Export</h3>
            
            <div class="option-group">
                <h4>Format</h4>
                <label class={`radio-option ${format === '3mf' ? 'selected' : ''}`}>
                    <input 
                        type="radio" 
                        name="format" 
                        value="3mf" 
                        checked={format === '3mf'}
                        onChange={() => setFormat('3mf')}
                    />
                    <div class="option-content">
                        <div class="option-title">3MF Triangle Mesh</div>
                        <div class="option-description">
                            Standard 3D Manufacturing Format with separate colored shapes. 
                            Compatible with most 3D slicers and printers.
                        </div>
                    </div>
                </label>
                
                <label class={`radio-option ${format === 'openscad' ? 'selected' : ''}`}>
                    <input 
                        type="radio" 
                        name="format" 
                        value="openscad" 
                        checked={format === 'openscad'}
                        onChange={() => setFormat('openscad')}
                    />
                    <div class="option-content">
                        <div class="option-title">OpenSCAD Masks</div>
                        <div class="option-description">
                            ZIP file with color masks (PNG) and OpenSCAD file. 
                            Allows customization and programmatic manipulation.
                        </div>
                    </div>
                </label>
            </div>

            <div class="option-group">
                <h4>Dimensions</h4>
                
                <label class="setting-row">
                    <span class="setting-label">Pixel Size (XY):</span>
                    <input 
                        type="number" 
                        value={pixelSize} 
                        onChange={(e) => setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                        min="0.1"
                        max="100"
                        step="0.1"
                    />
                    <span class="setting-unit">mm</span>
                </label>

                {format === '3mf' ? (
                    <label class="setting-row">
                        <span class="setting-label">Pixel Thickness (Z):</span>
                        <input 
                            type="number" 
                            value={pixelThickness} 
                            onChange={(e) => setPixelThickness(parseFloat((e.target as HTMLInputElement).value))}
                            min="0.1"
                            max="100"
                            step="0.1"
                        />
                        <span class="setting-unit">mm</span>
                    </label>
                ) : (
                    <label class="setting-row">
                        <span class="setting-label">Height Per Layer:</span>
                        <input 
                            type="number" 
                            value={heightPerLayer} 
                            onChange={(e) => setHeightPerLayer(parseFloat((e.target as HTMLInputElement).value))}
                            min="0.1"
                            max="100"
                            step="0.1"
                        />
                        <span class="setting-unit">mm</span>
                    </label>
                )}
            </div>

            <div class="export-info">
                <p><strong>Image:</strong> {props.image.width} × {props.image.height} pixels</p>
                <p><strong>Colors:</strong> {props.image.partList.length}</p>
                {format === '3mf' && (
                    <p><strong>Output Size:</strong> {(props.image.width * pixelSize).toFixed(1)} × {(props.image.height * pixelSize).toFixed(1)} × {pixelThickness.toFixed(1)} mm</p>
                )}
            </div>
        </div>

        <div class="print-buttons">
            <button 
                class="cancel" 
                onClick={() => updateProp("ui", "is3DOpen", false)}
                disabled={isExporting}
            >
                Cancel
            </button>
            <button 
                class="print" 
                onClick={() => handleExport()}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        
        try {
            let blob: Blob;
            let filename: string;

            if (format === '3mf') {
                const settings: ThreeMFSettings = {
                    pixelSize,
                    pixelThickness
                };
                blob = await generateThreeMF(props.image, settings);
                filename = `${props.filename.replace(/\.(png|jpg|jpeg)$/i, '')}.3mf`;
            } else {
                const settings: OpenSCADSettings = {
                    pixelSize,
                    heightPerLayer
                };
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = `${props.filename.replace(/\.(png|jpg|jpeg)$/i, '')}_openscad.zip`;
            }

            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.clarity?.("event", "3d-export", format);
            
            // Close dialog after successful export
            setTimeout(() => {
                updateProp("ui", "is3DOpen", false);
            }, 500);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please check the console for details.');
        } finally {
            setIsExporting(false);
        }
    }
}
