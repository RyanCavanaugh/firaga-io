import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../export-3d';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [height, setHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    const [pixelSize, setPixelSize] = useState(5);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup 
                format={format} 
                onFormatChange={setFormat}
            />
            <DimensionsGroup
                height={height}
                baseHeight={baseHeight}
                pixelSize={pixelSize}
                onHeightChange={setHeight}
                onBaseHeightChange={setBaseHeight}
                onPixelSizeChange={setPixelSize}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format,
            height,
            baseHeight,
            pixelSize
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ''));
    }
}

function FormatGroup(props: {
    format: '3mf' | 'openscad';
    onFormatChange: (format: '3mf' | 'openscad') => void;
}) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === '3mf'}
                    onChange={() => props.onFormatChange('3mf')}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.onFormatChange('openscad')}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔲</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? '3D Manufacturing Format - triangle mesh with separate materials for each color'
                : 'OpenSCAD masks - ZIP file with one black/white image per color and a .scad file'
            }
        </span>
    </div>;
}

function DimensionsGroup(props: {
    height: number;
    baseHeight: number;
    pixelSize: number;
    onHeightChange: (value: number) => void;
    onBaseHeightChange: (value: number) => void;
    onPixelSizeChange: (value: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="dimension-controls">
            <label>
                <span>Pixel Height (mm)</span>
                <input 
                    type="number"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={props.height}
                    onChange={(e) => props.onHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height (mm)</span>
                <input 
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={props.baseHeight}
                    onChange={(e) => props.onBaseHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Size (mm)</span>
                <input 
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={props.pixelSize}
                    onChange={(e) => props.onPixelSizeChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Configure the physical dimensions of the 3D model
        </span>
    </div>;
}
