import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, generateOpenSCADMasks, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    return (
        <div class="print-dialog">
            <div class="print-options">
                <div class="print-setting-group">
                    <h1>3D Export Format</h1>
                    <div class="print-setting-group-options">
                        <label>
                            <input
                                type="radio"
                                name="format"
                                checked={format === '3mf'}
                                onChange={() => setFormat('3mf')}
                            />
                            <div class="option">
                                <h3>3MF Triangle Mesh</h3>
                                <span class="format-icon">📐</span>
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
                                <h3>OpenSCAD Masks</h3>
                                <span class="format-icon">🎭</span>
                            </div>
                        </label>
                    </div>
                    <span class="description">
                        {format === '3mf'
                            ? 'Standard 3MF file with separate colored shapes for each color. Compatible with most 3D printing software.'
                            : 'ZIP file containing PNG masks and an OpenSCAD file that uses heightmap functionality to create a 3D model.'}
                    </span>
                </div>

                <div class="print-setting-group">
                    <h1>Dimensions (mm)</h1>
                    <div class="dimension-inputs">
                        <label>
                            <span>Pixel Height:</span>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={pixelHeight}
                                onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value) || 2)}
                            />
                        </label>
                        <label>
                            <span>Base Height:</span>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={baseHeight}
                                onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value) || 1)}
                            />
                        </label>
                    </div>
                    <span class="description">
                        Base height is the Z-offset for the model. Pixel height is the height of each colored layer.
                    </span>
                </div>
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp('ui', 'is3DOpen', false)}>
                    Cancel
                </button>
                <button class="print" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Export 3D'}
                </button>
            </div>
        </div>
    );

    async function handleExport(): Promise<void> {
        setIsExporting(true);
        try {
            const settings: ThreeDSettings = {
                format,
                pixelHeight,
                baseHeight,
            };

            let blob: Blob;
            let filename: string;

            if (format === '3mf') {
                blob = generate3MF(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '.3mf';
            } else {
                // Load JSZip dynamically if not already loaded
                if (!(window as any).JSZip) {
                    await loadJSZip();
                }
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '_openscad.zip';
            }

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.clarity?.('event', '3d-export', format);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsExporting(false);
        }
    }
}

async function loadJSZip(): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}
