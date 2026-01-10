import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDExportSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { PropContext } from './context';

export interface ThreeDExportDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelWidth, setPixelWidth] = useState(2.5);
    const [pixelHeight, setPixelHeight] = useState(2.5);
    const [pixelDepth, setPixelDepth] = useState(2.5);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <DimensionsGroup
                format={format}
                pixelWidth={pixelWidth}
                pixelHeight={pixelHeight}
                pixelDepth={pixelDepth}
                onPixelWidthChange={setPixelWidth}
                onPixelHeightChange={setPixelHeight}
                onPixelDepthChange={setPixelDepth}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;
    
    function exportModel() {
        const filename = props.filename.replace(/\.png$/i, '');
        
        if (format === '3mf') {
            const settings: ThreeDExportSettings = {
                format: '3mf',
                pixelWidth,
                pixelHeight,
                pixelDepth
            };
            
            const blob = generate3MF(props.image, settings);
            downloadBlob(blob, `${filename}.3mf`);
        } else {
            const settings: OpenSCADSettings = {
                pixelSize: pixelWidth,
                pixelHeight: pixelDepth
            };
            
            const blob = generateOpenSCADMasks(props.image, settings);
            downloadBlob(blob, `${filename}_openscad.zip`);
        }
        
        window.clarity?.("event", "3d-export");
        updateProp("ui", "is3DExportOpen", false);
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function FormatGroup(props: { format: '3mf' | 'openscad'; onFormatChange: (format: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input
                    type="radio"
                    name="format"
                    checked={props.format === '3mf'}
                    onChange={() => props.onFormatChange('3mf')}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input
                    type="radio"
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.onFormatChange('openscad')}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔷</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? '3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D software.'
                : 'ZIP file with black/white mask images per color and an OpenSCAD file to combine them into a 3D display.'}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    format: '3mf' | 'openscad';
    pixelWidth: number;
    pixelHeight: number;
    pixelDepth: number;
    onPixelWidthChange: (value: number) => void;
    onPixelHeightChange: (value: number) => void;
    onPixelDepthChange: (value: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-inputs">
                <label>
                    <span>Pixel Width:</span>
                    <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelWidth}
                        onChange={(e) => props.onPixelWidthChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Pixel Height:</span>
                    <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                {props.format === '3mf' && (
                    <label>
                        <span>Pixel Depth:</span>
                        <input
                            type="number"
                            min="0.1"
                            max="100"
                            step="0.1"
                            value={props.pixelDepth}
                            onChange={(e) => props.onPixelDepthChange(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                )}
            </div>
        </div>
        <span class="description">
            Set the physical dimensions for each pixel in the output model (in millimeters).
        </span>
    </div>;
}
