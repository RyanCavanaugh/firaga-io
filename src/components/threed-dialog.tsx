import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../threed-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>('3mf');
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog threed-dialog">
        <div class="print-options">
            <div class="option-group">
                <div class="option-group-title">Format</div>
                <div class="option-group-options">
                    <label class={format === '3mf' ? 'selected' : ''}>
                        <input
                            type="radio"
                            name="format"
                            value="3mf"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')}
                        />
                        <div class="option-content">
                            <div class="option-title">3MF Triangle Mesh</div>
                            <div class="option-description">
                                Industry-standard 3MF format with separate colored shapes for each color. Compatible with most 3D modeling software and slicers.
                            </div>
                        </div>
                    </label>
                    <label class={format === 'openscad-masks' ? 'selected' : ''}>
                        <input
                            type="radio"
                            name="format"
                            value="openscad-masks"
                            checked={format === 'openscad-masks'}
                            onChange={() => setFormat('openscad-masks')}
                        />
                        <div class="option-content">
                            <div class="option-title">OpenSCAD Masks</div>
                            <div class="option-description">
                                ZIP file containing B&W mask images for each color and an OpenSCAD file that combines them into a 3D heightmap display.
                            </div>
                        </div>
                    </label>
                </div>
            </div>
            
            <div class="option-group">
                <div class="option-group-title">Height Settings</div>
                <div class="option-group-options">
                    <label>
                        <span class="label-text">Pixel Height (mm):</span>
                        <input
                            type="number"
                            min="0.1"
                            max="20"
                            step="0.1"
                            value={pixelHeight}
                            onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                    <label>
                        <span class="label-text">Base Height (mm):</span>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            value={baseHeight}
                            onChange={(e) => setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                </div>
            </div>
        </div>
        
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;
    
    async function handleExport() {
        const settings: ThreeDSettings = {
            format,
            pixelHeight,
            baseHeight,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, '')
        };
        
        window.clarity?.("event", "export-3d", format);
        await generate3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}
