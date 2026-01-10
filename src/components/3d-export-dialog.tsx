import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { PropContext } from './context';

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};

type ExportFormat = '3mf' | 'openscad';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio" 
                            name="3d-format" 
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
                            name="3d-format" 
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
                        ? 'Standard 3D manufacturing format with separate material shapes for each color. Compatible with most 3D software.'
                        : 'ZIP file containing monochrome mask images and an OpenSCAD file that combines them into a 3D display.'}
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp('ui', 'is3dExportOpen', false)}>
                Cancel
            </button>
            <button 
                class="print" 
                onClick={() => handleExport()} 
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        try {
            window.clarity?.('event', '3d-export', format);
            
            if (format === '3mf') {
                await export3MF();
            } else {
                await exportOpenSCAD();
            }
            
            updateProp('ui', 'is3dExportOpen', false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }

    async function export3MF() {
        const blob = generate3MF(props.image);
        const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '') + '.3mf';
        downloadBlob(blob, filename);
    }

    async function exportOpenSCAD() {
        const blob = await generateOpenSCADMasks(props.image);
        const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '') + '_openscad.zip';
        downloadBlob(blob, filename);
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
