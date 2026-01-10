import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, ThreeDFormat } from '../three-d-exporter';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>('3mf');
    const [height, setHeight] = useState(3);
    const [isExporting, setIsExporting] = useState(false);

    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup format={format} setFormat={setFormat} />
                <HeightGroup height={height} setHeight={setHeight} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp('ui', 'is3DOpen', false)}>
                    Cancel
                </button>
                <button
                    class="print"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? 'Exporting...' : 'Export 3D'}
                </button>
            </div>
        </div>
    );

    async function handleExport() {
        setIsExporting(true);
        try {
            await export3D(props.image, {
                format,
                filename: props.filename.replace('.png', ''),
                height
            });
            window.clarity?.('event', '3d-export', { format, height });
            updateProp('ui', 'is3DOpen', false);
        } catch (error) {
            console.error('3D export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }
}

interface FormatGroupProps {
    format: ThreeDFormat;
    setFormat: (format: ThreeDFormat) => void;
}

function FormatGroup({ format, setFormat }: FormatGroupProps) {
    return (
        <div class="print-setting-group">
            <h1>Format</h1>
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
                        <span class="format-icon">📦</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={format === 'openscad-masks'}
                        onChange={() => setFormat('openscad-masks')}
                    />
                    <div class="option">
                        <h3>OpenSCAD Masks</h3>
                        <span class="format-icon">🔲</span>
                    </div>
                </label>
            </div>
            <span class="description">
                {format === '3mf'
                    ? '3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software.'
                    : 'Zip file with monochrome heightmaps and OpenSCAD script. Use with OpenSCAD to generate 3D models.'}
            </span>
        </div>
    );
}

interface HeightGroupProps {
    height: number;
    setHeight: (height: number) => void;
}

function HeightGroup({ height, setHeight }: HeightGroupProps) {
    return (
        <div class="print-setting-group">
            <h1>Height</h1>
            <div class="print-setting-group-options">
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={height === 2}
                        onChange={() => setHeight(2)}
                    />
                    <div class="option">
                        <h3>2mm</h3>
                        <span class="height-icon">▬</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={height === 3}
                        onChange={() => setHeight(3)}
                    />
                    <div class="option">
                        <h3>3mm</h3>
                        <span class="height-icon">▬▬</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={height === 5}
                        onChange={() => setHeight(5)}
                    />
                    <div class="option">
                        <h3>5mm</h3>
                        <span class="height-icon">▬▬▬</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={height === 10}
                        onChange={() => setHeight(10)}
                    />
                    <div class="option">
                        <h3>10mm</h3>
                        <span class="height-icon">▬▬▬▬</span>
                    </div>
                </label>
            </div>
            <span class="description">
                Extrusion height for the 3D model in millimeters. Taller models are easier to see but take longer to print.
            </span>
        </div>
    );
}
