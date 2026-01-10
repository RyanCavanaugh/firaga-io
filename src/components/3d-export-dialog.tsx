import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDExportSettings } from '../3d-export';
import { PropContext } from './context';

export interface ThreeDExportDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDExportDialog(props: ThreeDExportDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelWidth, setPixelWidth] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(5);
    const [pixelDepth, setPixelDepth] = useState(2);
    const [baseThickness, setBaseThickness] = useState(1);
    const [exporting, setExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <DimensionsGroup
                pixelWidth={pixelWidth}
                pixelHeight={pixelHeight}
                pixelDepth={pixelDepth}
                baseThickness={baseThickness}
                onPixelWidthChange={setPixelWidth}
                onPixelHeightChange={setPixelHeight}
                onPixelDepthChange={setPixelDepth}
                onBaseThicknessChange={setBaseThickness}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport(): Promise<void> {
        setExporting(true);
        try {
            const settings: ThreeDExportSettings = {
                format,
                pixelWidth,
                pixelHeight,
                pixelDepth,
                baseThickness
            };

            window.clarity?.("event", "3d-export", format);
            await export3D(props.image, settings);
        } catch (error) {
            console.error('3D export failed:', error);
            alert('Failed to export 3D model. Please try again.');
        } finally {
            setExporting(false);
        }
    }
}

function FormatGroup(props: { format: '3mf' | 'openscad'; onFormatChange: (format: '3mf' | 'openscad') => void }): JSX.Element {
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
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf'
                ? '3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.'
                : 'ZIP file containing heightmap images and OpenSCAD script for 3D display.'}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelWidth: number;
    pixelHeight: number;
    pixelDepth: number;
    baseThickness: number;
    onPixelWidthChange: (value: number) => void;
    onPixelHeightChange: (value: number) => void;
    onPixelDepthChange: (value: number) => void;
    onBaseThicknessChange: (value: number) => void;
}): JSX.Element {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-inputs">
                <label>
                    <span>Pixel Width:</span>
                    <input
                        type="number"
                        min="0.1"
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
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Pixel Depth:</span>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={props.pixelDepth}
                        onChange={(e) => props.onPixelDepthChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Base Thickness:</span>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={props.baseThickness}
                        onChange={(e) => props.onBaseThicknessChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Configure the physical dimensions of each pixel in the 3D model.
        </span>
    </div>;
}
