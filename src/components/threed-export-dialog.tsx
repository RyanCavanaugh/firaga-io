import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';
import { AppProps } from '../types';
import { PropContext } from './context';

export interface ThreeDExportDialogProps {
    image: PartListImage;
    filename: string;
}

type ExportFormat = '3mf' | 'openscad';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [pixelSize, setPixelSize] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SizeGroup 
                pixelSize={pixelSize}
                pixelHeight={pixelHeight}
                baseHeight={baseHeight}
                setPixelSize={setPixelSize}
                setPixelHeight={setPixelHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={doExport}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings = {
            pixelSize,
            pixelHeight,
            baseHeight
        };

        let blob: Blob;
        let filename: string;

        if (format === '3mf') {
            blob = export3MF(props.image, settings);
            filename = props.filename.replace(/\.(png|jpe?g)$/i, '') + '.3mf';
        } else {
            blob = exportOpenSCADMasks(props.image, settings);
            filename = props.filename.replace(/\.(png|jpe?g)$/i, '') + '_openscad.zip';
        }

        window.clarity?.("event", "3d-export");
        downloadBlob(blob, filename);
        updateProp("ui", "is3DExportOpen", false);
    }
}

function FormatGroup(props: { format: ExportFormat; setFormat: (f: ExportFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} 
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} 
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Triangle mesh with separate material shapes for each color. Standard industry format.'
                : 'ZIP file with mask images and OpenSCAD file that uses heightmap functionality.'}
        </span>
    </div>;
}

function SizeGroup(props: {
    pixelSize: number;
    pixelHeight: number;
    baseHeight: number;
    setPixelSize: (v: number) => void;
    setPixelHeight: (v: number) => void;
    setBaseHeight: (v: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-controls">
            <label>
                <span>Pixel Size</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.5" 
                    value={props.pixelSize}
                    onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.5" 
                    value={props.pixelHeight}
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height</span>
                <input 
                    type="number" 
                    min="0" 
                    step="0.5" 
                    value={props.baseHeight}
                    onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel size: width/depth of each pixel. Pixel height: height of colored pixels. Base height: optional base layer thickness.
        </span>
    </div>;
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
