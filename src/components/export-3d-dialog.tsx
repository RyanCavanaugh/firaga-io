import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat } from '../3d-exporter';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>('3mf');
    const [pixelWidth, setPixelWidth] = useState(2.5);
    const [pixelHeight, setPixelHeight] = useState(1.0);

    return <div class="print-dialog">
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
                            <h3>3MF</h3>
                            <span class="format-icon">🧊</span>
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
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? '3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D software.'
                        : 'ZIP file containing monochrome heightmap images and OpenSCAD file that combines them into a 3D display.'
                    }
                </span>
            </div>

            <div class="print-setting-group">
                <h1>Pixel Dimensions</h1>
                <div class="settings-group">
                    <div class="slider-group">
                        <label>
                            <span>Width/Depth (mm): {pixelWidth.toFixed(1)}</span>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="10" 
                                step="0.1" 
                                value={pixelWidth}
                                onChange={(e) => setPixelWidth(parseFloat((e.target as HTMLInputElement).value))}
                            />
                        </label>
                    </div>
                    <div class="slider-group">
                        <label>
                            <span>Height (mm): {pixelHeight.toFixed(1)}</span>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="5" 
                                step="0.1" 
                                value={pixelHeight}
                                onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                            />
                        </label>
                    </div>
                </div>
                <span class="description">
                    Physical size: {(props.image.width * pixelWidth).toFixed(1)}mm × {(props.image.height * pixelWidth).toFixed(1)}mm × {pixelHeight.toFixed(1)}mm
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D&nbsp;📥</button>
        </div>
    </div>;

    function handleExport() {
        const settings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelWidth,
            pixelHeight
        };
        
        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}
