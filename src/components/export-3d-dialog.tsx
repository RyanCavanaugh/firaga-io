import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../export-3d';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelHeight={pixelHeight} 
                baseHeight={baseHeight}
                setPixelHeight={setPixelHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => handleExport()}
                disabled={isExporting}
            >
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        try {
            const settings: Export3DSettings = {
                format,
                pixelHeight,
                baseHeight,
            };

            const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "");
            window.clarity?.("event", "export-3d", format);
            await export3D(props.image, settings, filename);
        } catch (error) {
            console.error("Export failed:", error);
            alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsExporting(false);
        }
    }
}

function FormatGroup(props: { format: Export3DFormat; setFormat: (f: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format - triangle mesh with separate materials per color. Compatible with most 3D printing software."
                : "OpenSCAD masks format - ZIP file with monochrome images and .scad file for heightmap-based 3D display."
            }
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelHeight: number;
    baseHeight: number;
    setPixelHeight: (h: number) => void;
    setBaseHeight: (h: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-inputs">
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={props.pixelHeight}
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value) || 2)}
                />
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={props.baseHeight}
                    onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value) || 1)}
                />
            </label>
        </div>
        <span class="description">
            Pixel height controls the thickness of each colored layer. Base height is the foundation layer thickness.
        </span>
    </div>;
}
