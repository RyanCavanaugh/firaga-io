import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { PropContext } from './context';
// @ts-ignore
import * as FileSaver from 'file-saver';
import { generate3MF } from '../export-3mf';
import { generateOpenSCADMasks } from '../export-openscad';

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};

type ExportFormat = '3mf' | 'openscad';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('3mf');
    const [voxelHeight, setVoxelHeight] = useState<number>(2.5);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio"
                            name="3d-format"
                            checked={selectedFormat === '3mf'}
                            onChange={() => setSelectedFormat('3mf')}
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">📐</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio"
                            name="3d-format"
                            checked={selectedFormat === 'openscad'}
                            onChange={() => setSelectedFormat('openscad')}
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {selectedFormat === '3mf' 
                        ? 'Export as a 3MF file with separate material shapes for each color. Compatible with most 3D slicers.'
                        : 'Export as a zip file containing monochrome mask images and an OpenSCAD script that combines them into a 3D display.'}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Voxel Height</h1>
                <div class="options-row">
                    <label>
                        Height (mm): 
                        <input 
                            type="number" 
                            min="0.1" 
                            max="10" 
                            step="0.1" 
                            value={voxelHeight}
                            onChange={(e) => setVoxelHeight(parseFloat((e.target as HTMLInputElement).value))}
                            style="margin-left: 10px; width: 80px;"
                        />
                    </label>
                </div>
                <span class="description">
                    The height of each pixel layer in millimeters. Default is 2.5mm.
                </span>
            </div>
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
            window.clarity?.("event", "3d-export", { format: selectedFormat });
            
            if (selectedFormat === '3mf') {
                const blob = generate3MF(props.image, voxelHeight);
                const filename = props.filename.replace(/\.(png|jpe?g)$/i, '') + '.3mf';
                FileSaver.saveAs(blob, filename);
            } else {
                const baseFilename = props.filename.replace(/\.(png|jpe?g)$/i, '');
                await generateOpenSCADMasks(props.image, baseFilename);
            }
            
            updateProp("ui", "is3DExportOpen", false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }
}
