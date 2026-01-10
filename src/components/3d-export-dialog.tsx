import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat } from '../3d-export';
import { PropContext } from './context';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [selectedFormat, setSelectedFormat] = useState<Export3DFormat>('3mf');
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup selectedFormat={selectedFormat} onFormatChange={setSelectedFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        try {
            window.clarity?.("event", "3d-export");
            await export3D(props.image, selectedFormat, props.filename.replace(/\.(png|jpg|jpeg|gif)$/i, ''));
        } catch (e) {
            console.error('Export failed:', e);
            alert('Export failed. See console for details.');
        } finally {
            setIsExporting(false);
            updateProp("ui", "is3DExportOpen", false);
        }
    }
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { selectedFormat: Export3DFormat, onFormatChange: (format: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Export Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.selectedFormat === '3mf'}
                    onChange={() => props.onFormatChange('3mf')} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.selectedFormat === 'openscad-masks'}
                    onChange={() => props.onFormatChange('openscad-masks')} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.selectedFormat === '3mf' 
                ? '3MF triangle mesh with separate material shapes for each color. Can be opened in most 3D modeling software.'
                : 'ZIP file containing monochrome masks (one per color) and an OpenSCAD file to combine them into a 3D display.'
            }
        </span>
    </div>;
}
