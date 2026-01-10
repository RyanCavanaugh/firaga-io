import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../export-3mf';
import { generateOpenSCADMasks } from '../export-openscad';
import { PropContext } from './context';
import { saveAs } from 'file-saver';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [voxelHeight, setVoxelHeight] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio" 
                            name="format" 
                            value="3mf"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} 
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="format" 
                            value="openscad"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} 
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? 'Standard 3MF file with separate colored shapes for each color. Compatible with most 3D modeling software.'
                        : 'ZIP file containing monochrome mask images and an OpenSCAD file that combines them into a 3D model.'
                    }
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Voxel Height</h1>
                <div class="options-row">
                    <input 
                        type="number" 
                        min="0.1" 
                        max="10" 
                        step="0.1" 
                        value={voxelHeight}
                        onChange={(e) => setVoxelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </div>
                <span class="description">Height of each pixel/bead in the 3D model</span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>
                Cancel
            </button>
            <button 
                class="print" 
                onClick={exportModel}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            window.clarity?.("event", "3d-export", format);

            let blob: Blob;
            let extension: string;

            if (format === '3mf') {
                blob = await generate3MF(props.image, voxelHeight);
                extension = '3mf';
            } else {
                blob = await generateOpenSCADMasks(props.image, props.filename);
                extension = 'zip';
            }

            // Trigger download using file-saver
            const filename = `${props.filename.replace(/\.[^/.]+$/, '')}.${extension}`;
            saveAs(blob, filename);

            updateProp("ui", "is3DExportOpen", false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }
}
