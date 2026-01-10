import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';
import { PropContext } from './context';
import * as FileSaver from 'file-saver';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

type ExportFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [pixelWidth, setPixelWidth] = useState(2.5);
    const [pixelHeight, setPixelHeight] = useState(2.5);
    const [pixelDepth, setPixelDepth] = useState(2.5);
    const [heightScale, setHeightScale] = useState(0.5);
    const [isExporting, setIsExporting] = useState(false);

    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup format={format} setFormat={setFormat} />
                
                {format === '3mf' && (
                    <SettingsGroup3MF
                        pixelWidth={pixelWidth}
                        pixelHeight={pixelHeight}
                        pixelDepth={pixelDepth}
                        setPixelWidth={setPixelWidth}
                        setPixelHeight={setPixelHeight}
                        setPixelDepth={setPixelDepth}
                    />
                )}
                
                {format === 'openscad' && (
                    <SettingsGroupOpenSCAD
                        pixelSize={pixelWidth}
                        heightScale={heightScale}
                        setPixelSize={setPixelWidth}
                        setHeightScale={setHeightScale}
                    />
                )}
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
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? 'Exporting...' : 'Export 3D'}
                </button>
            </div>
        </div>
    );

    async function handleExport() {
        setIsExporting(true);
        try {
            if (format === '3mf') {
                const settings: Export3MFSettings = {
                    pixelWidth,
                    pixelHeight,
                    pixelDepth
                };
                const blob = export3MF(props.image, settings);
                const filename = props.filename.replace(/\.[^.]+$/, '') + '.3mf';
                FileSaver.saveAs(blob, filename);
            } else {
                const settings: ExportOpenSCADSettings = {
                    pixelSize: pixelWidth,
                    heightScale
                };
                const blob = await exportOpenSCADMasks(props.image, settings);
                const filename = props.filename.replace(/\.[^.]+$/, '') + '_openscad.zip';
                FileSaver.saveAs(blob, filename);
            }
            
            window.clarity?.("event", "export-3d", format);
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }
}

function FormatGroup(props: { format: ExportFormat; setFormat: (f: ExportFormat) => void }) {
    return (
        <div class="print-setting-group">
            <h1>Format</h1>
            <div class="print-setting-group-options">
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={props.format === '3mf'}
                        onChange={() => props.setFormat('3mf')}
                    />
                    <div class="option">
                        <h3>3MF Mesh</h3>
                        <span class="format-icon">📦</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={props.format === 'openscad'}
                        onChange={() => props.setFormat('openscad')}
                    />
                    <div class="option">
                        <h3>OpenSCAD Masks</h3>
                        <span class="format-icon">🎭</span>
                    </div>
                </label>
            </div>
            <span class="description">
                {props.format === '3mf' 
                    ? '3MF triangle mesh with separate shapes for each color. Compatible with most 3D printing software.'
                    : 'ZIP file with monochrome masks and OpenSCAD file. Use OpenSCAD to customize and render the 3D model.'}
            </span>
        </div>
    );
}

function SettingsGroup3MF(props: {
    pixelWidth: number;
    pixelHeight: number;
    pixelDepth: number;
    setPixelWidth: (v: number) => void;
    setPixelHeight: (v: number) => void;
    setPixelDepth: (v: number) => void;
}) {
    return (
        <div class="print-setting-group">
            <h1>3MF Settings</h1>
            <div class="settings-inputs">
                <label>
                    Pixel Width (mm):
                    <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelWidth}
                        onChange={(e: any) => props.setPixelWidth(parseFloat(e.target.value))}
                    />
                </label>
                <label>
                    Pixel Height (mm):
                    <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e: any) => props.setPixelHeight(parseFloat(e.target.value))}
                    />
                </label>
                <label>
                    Pixel Depth (mm):
                    <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelDepth}
                        onChange={(e: any) => props.setPixelDepth(parseFloat(e.target.value))}
                    />
                </label>
            </div>
            <span class="description">
                Dimensions of each pixel in millimeters. Adjust for desired physical size.
            </span>
        </div>
    );
}

function SettingsGroupOpenSCAD(props: {
    pixelSize: number;
    heightScale: number;
    setPixelSize: (v: number) => void;
    setHeightScale: (v: number) => void;
}) {
    return (
        <div class="print-setting-group">
            <h1>OpenSCAD Settings</h1>
            <div class="settings-inputs">
                <label>
                    Pixel Size (mm):
                    <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelSize}
                        onChange={(e: any) => props.setPixelSize(parseFloat(e.target.value))}
                    />
                </label>
                <label>
                    Layer Height (mm):
                    <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={props.heightScale}
                        onChange={(e: any) => props.setHeightScale(parseFloat(e.target.value))}
                    />
                </label>
            </div>
            <span class="description">
                Each color layer is separated by the layer height. Open the .scad file in OpenSCAD to customize further.
            </span>
        </div>
    );
}
