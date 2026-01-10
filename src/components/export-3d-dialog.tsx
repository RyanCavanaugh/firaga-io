import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../export-3d';
import { AppProps } from '../types';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

type Export3DFormat = '3mf' | 'openscad';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>('3mf');
    const [height, setHeight] = useState<number>(2);

    return <div class="print-dialog export-3d-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;

    function handleExport() {
        const settings: Export3DSettings = {
            format,
            gridSize: props.gridSize,
            height,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, '')
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

function FormatGroup(props: { format: Export3DFormat; setFormat: (f: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input
                    type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')}
                />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input
                    type="radio"
                    name="3d-format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')}
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🔲</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf'
                ? 'Export as 3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.'
                : 'Export as ZIP file containing monochrome PNG masks and an OpenSCAD file that combines them into a 3D model using heightmaps.'}
        </span>
    </div>;
}

function HeightGroup(props: { height: number; setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Height (mm)</h1>
        <div class="print-setting-group-options">
            {[1, 2, 3, 5, 10].map(h => (
                <label key={h}>
                    <input
                        type="radio"
                        name="3d-height"
                        checked={props.height === h}
                        onChange={() => props.setHeight(h)}
                    />
                    <div class="option">
                        <h3>{h}mm</h3>
                        <span class="height-preview" style={{ height: `${h * 8}px` }}>█</span>
                    </div>
                </label>
            ))}
        </div>
        <span class="description">
            Thickness of the 3D model. Lower values work better for small objects.
        </span>
    </div>;
}
