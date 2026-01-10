import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../export-3d';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>("3mf");
    const [beadWidth, setBeadWidth] = useState(5);
    const [beadHeight, setBeadHeight] = useState(5);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                beadWidth={beadWidth} 
                beadHeight={beadHeight}
                setBeadWidth={setBeadWidth}
                setBeadHeight={setBeadHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: format,
            filename: props.filename.replace(".png", ""),
            beadHeight: beadHeight,
            beadWidth: beadWidth
        };

        window.clarity?.("event", "export-3d", format);
        export3D(props.image, settings);
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: Export3DFormat, setFormat: (f: Export3DFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format - Standard 3D print file with separate materials for each color"
                : "ZIP file with heightmap images and OpenSCAD script for customizable 3D models"}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    beadWidth: number,
    beadHeight: number,
    setBeadWidth: (w: number) => void,
    setBeadHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimension-inputs">
            <label>
                Bead Width:
                <input type="number" 
                    min="1" 
                    max="100" 
                    step="0.5"
                    value={props.beadWidth} 
                    onChange={(e) => props.setBeadWidth(parseFloat((e.target as HTMLInputElement).value))} />
            </label>
            <label>
                Bead Height:
                <input type="number" 
                    min="0.5" 
                    max="100" 
                    step="0.5"
                    value={props.beadHeight} 
                    onChange={(e) => props.setBeadHeight(parseFloat((e.target as HTMLInputElement).value))} />
            </label>
        </div>
        <span class="description">
            Dimensions for each bead in millimeters. Standard Perler beads are ~5mm wide and ~5mm tall when melted.
        </span>
    </div>;
}
