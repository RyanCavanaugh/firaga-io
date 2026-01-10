import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { getGridSize, getPitch } from '../utils';
import { PropContext } from './context';
import { generate3MF } from '../threed-3mf-generator';
import { generateOpenSCADMasks } from '../threed-openscad-generator';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const pitch = getPitch(props.gridSize);
            const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "");

            window.clarity?.("event", "3d-export", format);

            if (format === '3mf') {
                await generate3MF(props.image, pitch, filename);
            } else {
                await generateOpenSCADMasks(props.image, pitch, filename);
            }
        } finally {
            setIsExporting(false);
        }
    }
}

function FormatGroup(props: { format: '3mf' | 'openscad', onFormatChange: (format: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.onFormatChange('3mf')} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.onFormatChange('openscad')} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf'
                ? "Exports a 3MF file with separate material shapes for each color. Compatible with most 3D slicing software."
                : "Exports a ZIP file containing monochrome masks and an OpenSCAD file that combines them into a 3D model."}
        </span>
    </div>;
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};
