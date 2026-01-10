import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [layerHeight, setLayerHeight] = useState(0.2);
    const [baseThickness, setBaseThickness] = useState(1.0);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Export Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? 'Export as a 3D Manufacturing Format file with separate materials for each color. Compatible with most 3D printing software.'
                        : 'Export as a ZIP containing monochrome masks and an OpenSCAD file that combines them into a 3D heightmap display.'}
                </span>
            </div>

            <div class="print-setting-group">
                <h1>3D Settings</h1>
                <div class="options-group">
                    <label>
                        Layer Height (mm):
                        <input type="number" 
                            value={layerHeight} 
                            onChange={(e) => setLayerHeight(parseFloat((e.target as HTMLInputElement).value))}
                            min="0.1" 
                            max="1.0" 
                            step="0.05" />
                    </label>
                    <label>
                        Base Thickness (mm):
                        <input type="number" 
                            value={baseThickness} 
                            onChange={(e) => setBaseThickness(parseFloat((e.target as HTMLInputElement).value))}
                            min="0.5" 
                            max="10.0" 
                            step="0.5" />
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    function exportThreeD() {
        window.clarity?.("event", "3d-export");
        const settings = {
            layerHeight,
            baseThickness,
            filename: props.filename.replace(".png", "")
        };

        if (format === '3mf') {
            generate3MF(props.image, settings);
        } else {
            generateOpenSCADMasks(props.image, settings);
        }
        updateProp("ui", "is3DExportOpen", false);
    }
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
};
