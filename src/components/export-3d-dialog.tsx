import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { Export3DFormat, Export3DSettings, export3D } from '../export-3d';
import { PropContext } from './context';

export interface Export3DDialogProps {
    image: PartListImage;
    filename: string;
}

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>('3mf');
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={handleExport}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        try {
            const settings: Export3DSettings = {
                format,
                filename: props.filename.replace('.png', ''),
                pixelHeight,
                baseHeight,
            };

            window.clarity?.("event", "export-3d", format);
            await export3D(props.image, settings);
        } catch (error) {
            console.error('3D export failed:', error);
            alert('Export failed. Please check the console for details.');
        } finally {
            setIsExporting(false);
        }
    }
}

function FormatGroup({ format, setFormat }: { 
    format: Export3DFormat; 
    setFormat: (format: Export3DFormat) => void;
}) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={format === '3mf'}
                    onChange={() => setFormat('3mf')}
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
                    checked={format === 'openscad'}
                    onChange={() => setFormat('openscad')}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🎨</span>
                </div>
            </label>
        </div>
        <span class="description">
            {format === '3mf' 
                ? 'Triangle mesh with separate material shapes for each color. Compatible with most 3D printers and slicers.'
                : 'Zip file containing monochrome mask images and an OpenSCAD script that combines them into a 3D heightmap.'
            }
        </span>
    </div>;
}

function DimensionsGroup({ 
    pixelHeight, 
    setPixelHeight, 
    baseHeight, 
    setBaseHeight 
}: { 
    pixelHeight: number;
    setPixelHeight: (value: number) => void;
    baseHeight: number;
    setBaseHeight: (value: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-control">
                <label>
                    <span>Pixel Height:</span>
                    <input 
                        type="number" 
                        min="0.5" 
                        max="20" 
                        step="0.5" 
                        value={pixelHeight}
                        onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
            </div>
            <div class="dimension-control">
                <label>
                    <span>Base Height:</span>
                    <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.5" 
                        value={baseHeight}
                        onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
            </div>
        </div>
        <span class="description">
            Pixel height controls the vertical extrusion of each colored pixel. Base height adds a foundation layer.
        </span>
    </div>;
}
